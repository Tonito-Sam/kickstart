require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit'); // REPLACED PLAYWRIGHT WITH PDFKIT
// Note: puppeteer-core is only required lazily inside WhatsApp helpers when
// `AUTOSEND_WHATSAPP` is enabled. This allows the server to run without
// browser binaries when automation is disabled.
const nodemailer = require('nodemailer');

const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3333;
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Log key runtime environment values (non-sensitive) for debugging in deploy logs
console.log('Runtime env:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER ? 'set' : 'unset',
  DB_NAME: process.env.DB_NAME,
  HOST: process.env.HOST,
  AUTOSEND_WHATSAPP: process.env.AUTOSEND_WHATSAPP,
});

// ======================
// EMAIL CONFIGURATION
// ======================
let transporter = null;
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? 
      process.env.SMTP_PASS.replace(/^["']|["']$/g, '') : // Remove quotes if present
      ''
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create transporter if email config is available
if (EMAIL_CONFIG.host && EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
  try {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('📧 Email transporter created successfully');
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Email configuration error:', error.message);
        console.log('ℹ️ Email sending will be disabled');
        transporter = null;
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  } catch (emailError) {
    console.error('❌ Failed to create email transporter:', emailError.message);
    transporter = null;
  }
} else {
  console.log('ℹ️ Email configuration incomplete. Email sending disabled.');
}

// Email sending function
async function sendTicketEmail(toEmail, fullname, ticketPath, ticketUrl, ticketId) {
  if (!transporter) {
    console.log('⚠️ Email transporter not available, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`📧 Preparing to send ticket email to: ${toEmail}`);
    
    // Check if ticket file exists
    if (!fs.existsSync(ticketPath)) {
      throw new Error(`Ticket file not found: ${ticketPath}`);
    }
    
    const ticketFilename = path.basename(ticketPath);
    const fromEmail = process.env.EMAIL_FROM || 'event@kickstartevents.co.za';
    
    const mailOptions = {
      from: `"Kickstart 2026" <${fromEmail}>`,
      to: toEmail,
      replyTo: fromEmail,
      subject: `🎫 Your Kickstart 2026 Ticket - ${ticketId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Kickstart 2026 Ticket</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 700px; margin: 0 auto; background: white; padding: 0; }
        .header { background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 800; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 18px; }
        .content { padding: 40px 30px; }
        .ticket-info { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #3B82F6; }
        .button { display: inline-block; background: linear-gradient(90deg, #3B82F6, #8B5CF6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 15px 5px; text-align: center; }
        .qr-placeholder { text-align: center; margin: 25px 0; padding: 20px; background: #f1f5f9; border-radius: 12px; }
        .footer { background: #1e293b; color: #cbd5e1; padding: 30px; text-align: center; font-size: 14px; margin-top: 30px; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .details { margin: 25px 0; }
        .detail-item { margin: 12px 0; display: flex; }
        .detail-label { font-weight: 600; min-width: 150px; color: #475569; }
        .detail-value { color: #1e293b; }
        @media (max-width: 600px) {
            .container { width: 100% !important; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KICKSTART 2026</h1>
            <p>Google Up Growth</p>
        </div>
        
        <div class="content">
            <h2>Hello ${fullname},</h2>
            <p>Thank you for registering for <strong>Kickstart 2026: Google Up Growth</strong>! Your registration has been confirmed and your ticket is ready.</p>
            
            <div class="ticket-info">
                <h3 style="margin-top: 0; color: #3B82F6;">🎫 Your Ticket Details</h3>
                <div class="details">
                    <div class="detail-item">
                        <div class="detail-label">Ticket ID:</div>
                        <div class="detail-value"><strong>${ticketId}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Event:</div>
                        <div class="detail-value">Kickstart 2026 - Google Up Growth</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date:</div>
                        <div class="detail-value">January 24, 2026</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Time:</div>
                        <div class="detail-value">8:00 AM - 2:00 PM</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Venue:</div>
                        <div class="detail-value">The Knowledge Base, CNR 131, 33 Grossvenor Rd, Cumberland Ave, Bryanston, Sandton 2191</div>
                    </div>
                </div>
            </div>
            
            <div class="qr-placeholder">
                <p style="margin-top: 0;"><strong>📱 Your ticket includes a QR code for quick entry</strong></p>
                <p>Scan at registration for fast check-in</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${ticketUrl}" class="button">📄 Download Your Ticket</a>
                <a href="${ticketUrl.replace('/ticket/', '/preview/')}" class="button" style="background: #10b981;">👁️ Preview Ticket</a>
            </div>
            
            <div class="highlight">
                <h4 style="margin-top: 0;">📋 Important Information</h4>
                <p><strong>Please bring:</strong></p>
                <ul>
                    <li>This ticket (printed or on your phone)</li>
                    <li>Valid photo ID</li>
                    <li>Business cards for networking</li>
                </ul>
                <p><strong>Registration opens at 7:30 AM</strong></p>
            </div>
            
            <p>Your ticket is also attached to this email as a PDF. You can download it and print it, or show it on your mobile device at the registration desk.</p>
            
            <p>If you have any questions, please contact us at <a href="mailto:event@kickstartevents.co.za">event@kickstartevents.co.za</a>.</p>
            
            <p>We look forward to seeing you at Kickstart 2026!</p>
            
            <p>Best regards,<br>
            <strong>The Kickstart 2026 Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Kickstart 2026 • Google Up Growth</p>
            <p>January 24, 2026 • 8:00 AM - 2:00 PM</p>
            <p>The Knowledge Base, Sandton</p>
            <p><a href="mailto:event@kickstartevents.co.za">event@kickstartevents.co.za</a> • <a href="tel:+27123456789">+27 12 345 6789</a></p>
            <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: ticketFilename,
          path: ticketPath,
          contentType: 'application/pdf'
        }
      ]
    };
    
    console.log('📨 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${toEmail}`);
    console.log(`📫 Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipient: toEmail
    };
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { 
      success: false, 
      error: error.message,
      recipient: toEmail
    };
  }
}

// ======================
// DATABASE CONFIG - UPDATED FOR LIVE SERVER
// ======================
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'errandr1_kickstart',
  password: process.env.DB_PASSWORD || 'NFhRRPX6m3WtsWYHQvuZ',
  database: process.env.DB_NAME || 'errandr1_kickstart',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
  queueLimit: 0
});

async function ensureRegistrationsTable() {
  try {
    console.log('🔍 Checking/creating registrations table...');
    
    const [tables] = await dbPool.execute(
      "SHOW TABLES LIKE 'registrations'"
    );
    
    if (tables.length === 0) {
      console.log('📊 Table does not exist. Creating...');
      await dbPool.execute(`
        CREATE TABLE registrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_filename VARCHAR(255) NOT NULL,
          fullname VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(64),
          sector VARCHAR(128),
          role VARCHAR(128),
          registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ Table created successfully');
    } else {
      console.log('✅ Table already exists');
      
      // Check and add missing columns if needed
      try {
        const [columns] = await dbPool.query("DESCRIBE registrations");
        const columnNames = columns.map(col => col.Field);
        
        // Add created_at if missing
        if (!columnNames.includes('created_at')) {
          console.log('⚠️ Adding created_at column...');
          await dbPool.execute(`
            ALTER TABLE registrations 
            ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          `);
          console.log('✅ created_at column added');
        }
        
        // Add company if missing
        if (!columnNames.includes('company')) {
          console.log('⚠️ Adding company column...');
          await dbPool.execute(`
            ALTER TABLE registrations 
            ADD COLUMN company VARCHAR(255) AFTER role
          `);
          console.log('✅ company column added');
        }
        
      } catch (alterError) {
        console.log('ℹ️ Could not check/add columns:', alterError.message);
      }
    }
  } catch (e) {
    console.error('❌ Failed to ensure registrations table:', e.message);
    throw e;
  }
}

async function saveRegistrationToDb(reg, filename) {
  try {
    console.log('💾 Saving to database:', { 
      filename, 
      fullname: reg.fullname, 
      email: reg.email 
    });
    
    // Get current table structure
    const [columns] = await dbPool.query("DESCRIBE registrations");
    const columnNames = columns.map(col => col.Field);
    
    console.log('📊 Available columns:', columnNames);
    
    // Build SQL based on available columns
    let sql = '';
    let params = [];
    
    if (columnNames.includes('company') && columnNames.includes('created_at')) {
      sql = `
        INSERT INTO registrations 
        (ticket_filename, fullname, email, phone, sector, role, company, registration_date, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      params = [
        filename, 
        reg.fullname || null, 
        reg.email || null, 
        reg.phone || null, 
        reg.sector || '', 
        reg.role || '',
        reg.company || ''
      ];
    } else if (columnNames.includes('company')) {
      sql = `
        INSERT INTO registrations 
        (ticket_filename, fullname, email, phone, sector, role, company, registration_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      params = [
        filename, 
        reg.fullname || null, 
        reg.email || null, 
        reg.phone || null, 
        reg.sector || '', 
        reg.role || '',
        reg.company || ''
      ];
    } else if (columnNames.includes('created_at')) {
      sql = `
        INSERT INTO registrations 
        (ticket_filename, fullname, email, phone, sector, role, registration_date, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      params = [
        filename, 
        reg.fullname || null, 
        reg.email || null, 
        reg.phone || null, 
        reg.sector || '', 
        reg.role || ''
      ];
    } else {
      // Basic table structure (no company, no created_at)
      sql = `
        INSERT INTO registrations 
        (ticket_filename, fullname, email, phone, sector, role, registration_date) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      params = [
        filename, 
        reg.fullname || null, 
        reg.email || null, 
        reg.phone || null, 
        reg.sector || '', 
        reg.role || ''
      ];
    }
    
    console.log('📝 Executing SQL:', sql);
    console.log('📝 With params:', params);
    
    const [result] = await dbPool.execute(sql, params);
    console.log('✅ Database saved! Insert ID:', result.insertId);
    
    return result.insertId;
  } catch (e) {
    console.error('❌ Failed to save registration to DB:', e.message);
    console.error('SQL Error:', e.sqlMessage || 'No SQL message');
    console.error('Error Code:', e.code || 'No code');
    console.error('Error Number:', e.errno || 'No errno');
    console.error('SQL State:', e.sqlState || 'No SQL state');
    throw e;
  }
}

// ======================
// PDF GENERATION WITH PDFKIT (RENDER COMPATIBLE)
// ======================
async function generateTicketPDF(reg, filename) {
  const ticketPath = path.join(TMP_DIR, filename);
  console.log(`🎫 Generating PDF ticket: ${filename}`);
  
  return new Promise(async (resolve, reject) => {
    try {
      // Generate QR code
      let qrCodeBuffer = null;
      try {
        const qrData = `KICKSTART2026:${filename.replace('.pdf', '')}:${reg.fullname}:${reg.email}`;
        qrCodeBuffer = await QRCode.toBuffer(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#3B82F6',
            light: '#FFFFFF'
          }
        });
      } catch (qrError) {
        console.warn('⚠️ QR code generation failed:', qrError.message);
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const stream = fs.createWriteStream(ticketPath);
      doc.pipe(stream);

      // Header with gradient effect
      doc.rect(0, 0, doc.page.width, 120)
         .fill('#3B82F6');
      
      doc.fillColor('white')
         .fontSize(36)
         .font('Helvetica-Bold')
         .text('KICKSTART 2026', {
           align: 'center',
           y: 30
         });
      
      doc.fontSize(20)
         .text('Google Up Growth', {
           align: 'center',
           y: 80
         });

      // Divider line
      doc.moveTo(50, 140)
         .lineTo(550, 140)
         .lineWidth(2)
         .strokeColor('#3B82F6')
         .stroke();

      // Attendee Info Section
      doc.fillColor('#1E293B')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('ATTENDEE INFORMATION', 50, 160);
      
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#475569');
      
      let yPos = 190;
      const infoFields = [
        { label: 'Full Name:', value: reg.fullname || 'Not provided' },
        { label: 'Email:', value: reg.email || 'Not provided' },
        { label: 'Phone:', value: reg.phone || 'Not provided' },
        { label: 'Role:', value: reg.role || 'Not provided' },
        { label: 'Company:', value: reg.company || 'Not provided' },
        { label: 'Sector:', value: reg.sector || 'Not provided' }
      ];

      infoFields.forEach(field => {
        doc.text(`${field.label}`, 50, yPos);
        doc.fillColor('#1E293B')
           .text(field.value, 150, yPos);
        doc.fillColor('#475569');
        yPos += 22;
      });

      // Event Details Section
      doc.moveTo(50, yPos + 10)
         .lineTo(550, yPos + 10)
         .lineWidth(1)
         .strokeColor('#E2E8F0')
         .stroke();
      
      yPos += 30;
      
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor('#1E293B')
         .text('EVENT DETAILS', 50, yPos);
      
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#475569');
      
      yPos += 30;
      const eventDetails = [
        '📅 Date: January 24, 2026',
        '⏰ Time: 8:00 AM - 2:00 PM',
        '📍 Venue: The Knowledge Base',
        '        CNR 131, 33 Grossvenor Rd',
        '        Cumberland Ave, Bryanston',
        '        Sandton 2191'
      ];

      eventDetails.forEach(detail => {
        doc.text(detail, 50, yPos);
        yPos += 20;
      });

      // QR Code Section (right side)
      const qrX = 400;
      const qrY = 200;
      
      if (qrCodeBuffer) {
        doc.image(qrCodeBuffer, qrX, qrY, { width: 120, height: 120 });
        doc.rect(qrX - 5, qrY - 5, 130, 130)
           .stroke('#3B82F6')
           .lineWidth(2);
      } else {
        doc.rect(qrX, qrY, 120, 120)
           .fill('#3B82F6');
        doc.fillColor('white')
           .fontSize(12)
           .text('SCAN AT ENTRY', qrX + 10, qrY + 50, { width: 100, align: 'center' });
      }
      
      doc.fontSize(10)
         .fillColor('#64748B')
         .text('SCAN FOR ENTRY', qrX + 10, qrY + 130, { width: 100, align: 'center' });

      // Ticket ID
      const ticketId = filename.replace('.pdf', '').toUpperCase();
      doc.fillColor('#3B82F6')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(`TICKET ID: ${ticketId}`, 50, 450);

      // Footer with important info
      doc.moveTo(50, 480)
         .lineTo(550, 480)
         .lineWidth(1)
         .strokeColor('#E2E8F0')
         .stroke();
      
      doc.fontSize(10)
         .fillColor('#64748B')
         .text('IMPORTANT: Please bring this ticket (printed or digital) and a valid ID to the registration desk.', 
               50, 490, { width: 500 });
      
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} • #KICKSTART2026`, 50, 520);

      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(ticketPath);
        console.log(`✅ PDF generated: ${ticketPath} (${stats.size} bytes)`);
        resolve(ticketPath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      console.error('❌ PDF generation failed:', error.message);
      reject(error);
    }
  });
}

function generateSimpleTicket(reg, filename) {
  const ticketPath = path.join(TMP_DIR, filename);
  
  const content = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                              KICKSTART 2026                                    ║
║                             Google Up Growth                                   ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  TICKET ID: ${filename.replace('.pdf', '')}                                     ║
║  ISSUED: ${new Date().toLocaleString()}                                        ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────── ║
║  ATTENDEE INFORMATION:                                                         ║
║    • Name:    ${reg.fullname || 'Not provided'}                               ║
║    • Email:   ${reg.email || 'Not provided'}                                  ║
║    • Phone:   ${reg.phone || 'Not provided'}                                  ║
║    • Role:    ${reg.role || 'Not provided'}                                   ║
║    • Company: ${reg.company || 'Not provided'}                                ║
║    • Sector:  ${reg.sector || 'Not provided'}                                 ║
║                                                                                ║
║  ───────────────────────────────────────────────────────────────────────────── ║
║  EVENT DETAILS:                                                                ║
║    • Date:    January 24, 2026                                                 ║
║    • Time:    8:00 AM - 2:00 PM                                                ║
║    • Venue:   The Knowledge Base                                               ║
║               CNR 131, 33 Grossvenor Rd                                        ║
║               Cumberland Ave, Bryanston, Sandton 2191                          ║
║                                                                                ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║           Thank you for registering for Kickstart 2026!                        ║
║           Please bring this ticket and valid ID to the event.                  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;
  
  fs.writeFileSync(ticketPath, content);
  console.log(`📄 Fallback ticket created: ${ticketPath}`);
  return ticketPath;
}

// ======================
// ENDPOINTS
// ======================

app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    server: 'kickstart-server',
    version: '3.0.0',
    features: ['pdf-generation', 'database', 'qr-codes', 'email'],
    pdf_engine: 'pdfkit',
    render_compatible: true,
    email_enabled: !!transporter,
    database_configured: !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT COUNT(*) as count FROM registrations');
    const [columns] = await dbPool.query('DESCRIBE registrations');
    
    res.json({
      success: true,
      table: 'registrations',
      rowCount: rows[0].count,
      columns: columns.map(c => ({ 
        name: c.Field, 
        type: c.Type,
        nullable: c.Null === 'YES'
      })),
      connection: 'active'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
  }
});

app.get('/test-email', async (req, res) => {
  if (!transporter) {
    return res.status(400).json({
      success: false,
      error: 'Email service not configured'
    });
  }
  
  try {
    const testEmail = req.query.email || 'test@example.com';
    
    const mailOptions = {
      from: `"Kickstart 2026" <${process.env.EMAIL_FROM || 'event@kickstartevents.co.za'}>`,
      to: testEmail,
      subject: '✅ Kickstart 2026 - Email Test',
      text: 'This is a test email from the Kickstart 2026 ticket server.',
      html: '<h2>✅ Email Test Successful</h2><p>This is a test email from the Kickstart 2026 ticket server.</p>'
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      recipient: testEmail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/register', async (req, res) => {
  console.log('\n' + '='.repeat(70));
  console.log('📝 REGISTER REQUEST RECEIVED');
  console.log('='.repeat(70));
  
  try {
    const requestData = req.body || {};
    
    console.log('📦 Raw request body:', JSON.stringify(requestData, null, 2));
    
    const fullname = requestData.fullname || `${requestData.firstName || ''} ${requestData.lastName || ''}`.trim();
    const email = requestData.email || '';
    const phone = requestData.phone || '';
    const sector = requestData.sector || requestData.industry || '';
    const role = requestData.role || requestData.jobTitle || requestData.position || '';
    const company = requestData.company || requestData.organization || '';
    
    if (!fullname || !email) {
      return res.status(400).json({ 
        ok: false,
        error: 'Full name and email are required',
        received: { fullname, email }
      });
    }
    
    const normalizedData = {
      fullname: fullname,
      email: email,
      phone: phone,
      sector: sector,
      role: role,
      company: company
    };
    
    console.log('🔄 Normalized data:', normalizedData);
    
    const ticketId = `KST${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    const filename = `${ticketId}.pdf`;
    
    console.log(`🎫 Processing: ${normalizedData.fullname}`);
    console.log(`🎫 Email: ${normalizedData.email}`);
    console.log(`🎫 Ticket ID: ${ticketId}`);
    console.log(`📁 Filename: ${filename}`);
    
    // Step 1: Ensure table exists and save to database
    let dbInsertId = null;
    try {
      await ensureRegistrationsTable();
      dbInsertId = await saveRegistrationToDb(normalizedData, filename);
      console.log('✅ Database save successful, ID:', dbInsertId);
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr.message);
      console.error('Database error stack:', dbErr.stack);
      console.log('⚠️ Continuing without database...');
    }
    
    // Step 2: Generate PDF
    let ticketPath = null;
    let pdfSize = 0;
    try {
      ticketPath = await generateTicketPDF(normalizedData, filename);
      if (ticketPath && fs.existsSync(ticketPath)) {
        pdfSize = fs.statSync(ticketPath).size;
        console.log(`✅ PDF generated: ${pdfSize} bytes`);
      }
    } catch (pdfErr) {
      console.error('❌ PDF generation error:', pdfErr.message);
      try {
        ticketPath = generateSimpleTicket(normalizedData, filename);
        pdfSize = fs.statSync(ticketPath).size;
        console.log(`✅ Fallback ticket created: ${pdfSize} bytes`);
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr.message);
      }
    }
    
    // Step 3: Prepare URLs - FIXED FOR RENDER
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const ticketUrl = `${baseUrl}/ticket/${encodeURIComponent(filename)}`;
    const previewUrl = `${baseUrl}/preview/${encodeURIComponent(filename)}`;
    
    // Step 4: Send email
    let emailResult = null;
    if (ticketPath && fs.existsSync(ticketPath) && email) {
      console.log('📨 Queueing email sending...');
      
      sendTicketEmail(email, fullname, ticketPath, ticketUrl, ticketId)
        .then(result => {
          console.log(`📧 Email result for ${email}:`, result.success ? '✅ Sent' : '❌ Failed');
        })
        .catch(emailErr => {
          console.error('📧 Email sending error:', emailErr.message);
        });
    } else if (!email) {
      console.log('⚠️ No email provided, skipping email sending');
    }
    
    // Step 5: Prepare response
    const response = {
      ok: true,
      ticketId: ticketId,
      ticketFilename: filename,
      ticketUrl: ticketUrl,
      previewUrl: previewUrl,
      database: {
        success: !!dbInsertId,
        insertId: dbInsertId
      },
      pdf: {
        generated: !!ticketPath,
        size: pdfSize
      },
      email: {
        sent: !!email,
        recipient: email,
        status: email ? 'queued' : 'not_sent'
      },
      attendee: {
        name: normalizedData.fullname,
        email: normalizedData.email
      },
      message: 'Registration successful! Your ticket has been generated.',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Registration complete!');
    console.log(`🔗 Ticket URL: ${ticketUrl}`);
    console.log(`🔗 Preview URL: ${previewUrl}`);
    console.log('📊 Response:', JSON.stringify(response, null, 2));
    console.log('='.repeat(70) + '\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('🔥 Unhandled error in /register:', error.message);
    console.error('🔥 Stack:', error.stack);
    
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/ticket/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(TMP_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: 'Ticket not found',
      filename: filename
    });
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

app.get('/preview/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(TMP_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Ticket not found');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Preview Ticket</title>
        <style>
            body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; }
            .container { max-width: 1000px; }
            iframe { width: 100%; height: 90vh; border: none; box-shadow: 0 5px 25px rgba(0,0,0,0.1); border-radius: 10px; }
            .actions { margin-top: 20px; text-align: center; }
            .btn { padding: 12px 24px; margin: 0 10px; background: #3B82F6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <iframe src="/ticket/${encodeURIComponent(filename)}"></iframe>
            <div class="actions">
                <button class="btn" onclick="window.print()">Print Ticket</button>
                <button class="btn" onclick="window.location.href='/ticket/${encodeURIComponent(filename)}'">Download PDF</button>
                <button class="btn" onclick="window.close()">Close</button>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/tickets', (req, res) => {
  try {
    const files = fs.readdirSync(TMP_DIR);
    const tickets = files.map(file => {
      const stats = fs.statSync(path.join(TMP_DIR, file));
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        url: `/ticket/${encodeURIComponent(file)}`,
        preview: `/preview/${encodeURIComponent(file)}`
      };
    });
    
    res.json({
      count: files.length,
      tickets: tickets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/db-entries', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM registrations ORDER BY registration_date DESC LIMIT 50');
    
    res.json({
      count: rows.length,
      entries: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Kickstart 2026 Ticket Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #0F172A; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #3B82F6; }
            .endpoint { background: #1E293B; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3B82F6; }
            .method { display: inline-block; padding: 4px 12px; background: #3B82F6; border-radius: 4px; font-weight: bold; margin-right: 10px; }
            .success { color: #10B981; }
            .warning { color: #F59E0B; }
        </style>
    </head>
<body>
    <div class="container">
        <h1>🎫 Kickstart 2026 Ticket Server</h1>
        <p><strong>Status:</strong> <span class="success">Running on Render</span></p>
        <p><strong>Database:</strong> <span class="${dbPool ? 'success' : 'warning'}">${dbPool ? 'Connected' : 'Not Connected'}</span></p>
        <p><strong>Email:</strong> <span class="${transporter ? 'success' : 'warning'}">${transporter ? 'Enabled' : 'Disabled'}</span></p>
        <p><strong>PDF Engine:</strong> PDFKit (Render Compatible)</p>
        
        <h2>Endpoints:</h2>
        
        <div class="endpoint">
            <span class="method">GET</span> <code>/health</code> - Server health
        </div>
        
        <div class="endpoint">
            <span class="method">POST</span> <code>/register</code> - Register and get ticket
        </div>
        
        <div class="endpoint">
            <span class="method">GET</span> <code>/ticket/[filename]</code> - Download ticket
        </div>
        
        <div class="endpoint">
            <span class="method">GET</span> <code>/test-db</code> - Test database
        </div>
        
        <div class="endpoint">
            <span class="method">GET</span> <code>/test-email?email=you@example.com</code> - Test email
        </div>
    </div>
</body>
</html>
  `);
});

// ======================
// START SERVER
// ======================

async function startServer() {
  console.log('🚀 Starting Kickstart Server (Render Compatible)');
  console.log('='.repeat(60));
  console.log('📊 Database:', process.env.DB_NAME || 'Not configured');
  console.log('📧 Email:', transporter ? 'Enabled' : 'Disabled');
  console.log('📄 PDF Engine: PDFKit (No browser required)');
  console.log('='.repeat(60));
  
  try {
    const [test] = await dbPool.query('SELECT 1 as test');
    console.log('✅ Database connected');
    
    await ensureRegistrationsTable();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`📝 Register: POST http://localhost:${PORT}/register`);
      console.log('='.repeat(60));
      console.log('Ready! 🎫');
    });
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('🔄 Shutting down...');
  if (transporter) transporter.close();
  dbPool.end();
  process.exit(0);
});

startServer();