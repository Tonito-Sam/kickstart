<?php
// server/register.php
// Accepts JSON POST { fullname,email,phone,sector,role }
// Inserts into MySQL and then calls the existing Node /register endpoint
// to generate the ticket PDF, fetches it and emails it to the participant.

header('Content-Type: application/json');

// --------- CONFIG (override with env or edit here) -----------------
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbName = getenv('DB_NAME') ?: 'kickstart';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$nodeRegisterUrl = getenv('NODE_REGISTER_URL') ?: '';
// PHPMailer (recommended) will be used for SMTP sending. Install via composer:
// composer require phpmailer/phpmailer
$smtpHost = getenv('SMTP_HOST') ?: '';
$smtpPort = getenv('SMTP_PORT') ?: '';
$smtpUser = getenv('SMTP_USER') ?: '';
$smtpPass = getenv('SMTP_PASS') ?: '';
$fromEmail = getenv('FROM_EMAIL') ?: 'no-reply@example.com';
$fromName = getenv('FROM_NAME') ?: 'Kickstart';
// ------------------------------------------------------------------

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) respond(400, ['error' => 'Invalid JSON']);
$fullname = trim($data['fullname'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$sector = trim($data['sector'] ?? '');
$role = trim($data['role'] ?? '');
if (!$fullname || !$email || !$phone) respond(400, ['error' => 'fullname,email,phone required']);

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare('INSERT INTO registrations (fullname,email,phone,sector,role) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$fullname, $email, $phone, $sector, $role]);
    $insertId = $pdo->lastInsertId();
} catch (Exception $e) {
    respond(500, ['error' => 'DB error: ' . $e->getMessage()]);
}
// Decide whether to use the existing Node renderer or the PHP renderer.
$useNode = !empty($nodeRegisterUrl) && (getenv('USE_NODE') !== 'false');

// prepare a temp file path for the ticket PDF
$tmpFile = tempnam(sys_get_temp_dir(), 'ticket_') . '.pdf';

if ($useNode) {
    // Ask existing Node server to render the ticket and return URLs
    $nodeUrl = rtrim($nodeRegisterUrl, '/') . '/register';
    $payload = json_encode(['fullname'=>$fullname,'email'=>$email,'phone'=>$phone,'sector'=>$sector,'role'=>$role]);
    $ch = curl_init($nodeUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($response === false) respond(500, ['error' => 'Failed to contact Node register endpoint: ' . $curlErr]);
    $nodeBody = json_decode($response, true);
    if (!$nodeBody || !isset($nodeBody['ticketUrl'])) {
        respond(500, ['error' => 'Unexpected response from Node register: ' . ($response ?: '')]);
    }
    $ticketUrl = $nodeBody['ticketUrl'];

    // Fetch the PDF
    $fp = fopen($tmpFile, 'w');
    $ch = curl_init($ticketUrl);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $ok = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    fclose($fp);
    if (!$ok || $httpCode >= 400) {
        @unlink($tmpFile);
        respond(500, ['error' => 'Failed to download ticket PDF: ' . $curlErr]);
    }
} else {
    // Use PHP renderer (Dompdf + QR generator). Require composer packages:
    // composer require dompdf/dompdf chillerlan/php-qrcode
    if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
        respond(500, ['error' => 'PHP renderer requires composer dependencies (run: composer require dompdf/dompdf chillerlan/php-qrcode phpmailer/phpmailer)']);
    }
    require __DIR__ . '/vendor/autoload.php';

    // load template
    $templatePath = __DIR__ . '/templates/ticket.html';
    if (!file_exists($templatePath)) respond(500, ['error' => 'Ticket template not found: ' . $templatePath]);
    $template = file_get_contents($templatePath);

    // prepare logo if available (same asset path as Node server)
    $logoDataUrl = '';
    $logoPath = __DIR__ . '/../src/assets/kickstart-logo.png';
    if (file_exists($logoPath)) {
        $buf = file_get_contents($logoPath);
        $logoDataUrl = 'data:image/png;base64,' . base64_encode($buf);
    }

    // ticket id
    $safe = preg_replace('/[^a-z0-9\-]/i', '_', strtolower($fullname ?: 'ticket'));
    $ticketId = $safe . '-' . time();

    // generate QR code PNG (binary)
    try {
        $qrText = 'KICKSTART:' . $ticketId;
        $qroptions = new \chillerlan\QRCode\QRCodeOptions();
        $qrcode = new \chillerlan\QRCode\QRCode($qroptions);
        $qrPng = $qrcode->render($qrText);
        $qrDataUrl = 'data:image/png;base64,' . base64_encode($qrPng);
    } catch (Exception $e) {
        $qrDataUrl = '';
    }

    // replace tokens
    $html = str_replace(['{{logoDataUrl}}','{{qrDataUrl}}','{{ticketId}}','{{fullname}}','{{email}}','{{phone}}','{{sector}}','{{role}}','{{eventTitle}}','{{eventDate}}','{{eventVenue}}'],
                        [$logoDataUrl,$qrDataUrl,$ticketId,htmlspecialchars($fullname),htmlspecialchars($email),htmlspecialchars($phone),htmlspecialchars($sector),htmlspecialchars($role),htmlspecialchars(getenv('EVENT_TITLE')?:'Kickstart 2026'),htmlspecialchars(getenv('EVENT_DATE')?:'TBA'),htmlspecialchars(getenv('EVENT_VENUE')?:'TBA')],
                        $template);

    // render PDF with Dompdf
    try {
        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A5', 'portrait');
        $dompdf->render();
        $output = $dompdf->output();
        file_put_contents($tmpFile, $output);
    } catch (Exception $e) {
        @unlink($tmpFile);
        respond(500, ['error' => 'PDF render failed: ' . $e->getMessage()]);
    }

}

// Send email with PHPMailer if available, else attempt PHP mail() fallback (less reliable)
$sent = false;
$mailError = '';
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
    if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            if ($smtpHost) {
                $mail->isSMTP();
                $mail->Host = $smtpHost;
                if (!empty($smtpPort)) $mail->Port = (int)$smtpPort;
                $mail->SMTPAuth = !empty($smtpUser);
                if (!empty($smtpUser)) $mail->Username = $smtpUser;
                if (!empty($smtpPass)) $mail->Password = $smtpPass;
                $mail->SMTPSecure = 'tls';
            }
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($email, $fullname);
            $mail->Subject = 'Your Kickstart ticket';
            $mail->Body = "Hi {$fullname},\n\nAttached is your ticket for the event.\n\nRegards,\n{$fromName}";
            $mail->addAttachment($tmpFile, 'ticket.pdf');
            $mail->send();
            $sent = true;
        } catch (Exception $e) {
            $mailError = 'PHPMailer error: ' . $e->getMessage();
        }
    } else {
        $mailError = 'PHPMailer classes not found in vendor autoload';
    }
} else {
    // basic mail() fallback with attachment
    $boundary = md5(time());
    $headers = "From: {$fromName} <{$fromEmail}>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

    $message = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= "Hi {$fullname},\n\nAttached is your ticket for the event.\n\nRegards,\n{$fromName}\r\n\r\n";

    $fileContent = chunk_split(base64_encode(file_get_contents($tmpFile)));
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: application/pdf; name=\"ticket.pdf\"\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n";
    $message .= "Content-Disposition: attachment; filename=\"ticket.pdf\"\r\n\r\n";
    $message .= $fileContent . "\r\n\r\n";
    $message .= "--{$boundary}--";

    $ok = mail($email, 'Your Kickstart ticket', $message, $headers);
    if ($ok) $sent = true; else $mailError = 'mail() failed (check PHP mail configuration)';
}

@unlink($tmpFile);

if (!$sent) respond(500, ['error' => 'Failed to send email: ' . $mailError]);

respond(200, ['ok' => true, 'message' => 'Registration stored and ticket emailed']);

