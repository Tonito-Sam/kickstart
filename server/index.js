require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const QRCode = require('qrcode');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3333;
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

let browserPromise = null;
// simple promise queue to serialize browser tasks (avoid concurrent newPage races)
let browserQueue = Promise.resolve();

function enqueueBrowserTask(fn) {
  // chain tasks sequentially
  browserQueue = browserQueue.then(() => fn()).catch((err) => {
    // log but don't break the queue chain
    console.warn('Browser task error', err && err.message ? err.message : err);
  });
  return browserQueue;
}
async function ensureBrowser() {
  // if a browser exists but the CDP connection is closed, reset it and relaunch
  if (browserPromise) {
    try {
      const b = await browserPromise;
      if (!b || (typeof b.isConnected === 'function' && !b.isConnected())) {
        browserPromise = null;
      }
    } catch (e) {
      // existing promise failed, reset
      browserPromise = null;
    }
  }

  if (!browserPromise) {
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH; // e.g. C:\Program Files\Google\Chrome\Application\chrome.exe
    const userData = process.env.PUPPETEER_USER_DATA_DIR || path.join(__dirname, 'puppeteer_profile');
    const launchOpts = { headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run', '--disable-session-crashed-bubble', '--disable-infobars', '--disable-extensions', '--disable-background-networking'], userDataDir: userData };
    if (execPath) launchOpts.executablePath = execPath;
    console.log('Launching browser with options:', { executablePath: launchOpts.executablePath, userDataDir: launchOpts.userDataDir });
    browserPromise = puppeteer.launch(launchOpts).catch(err => {
      console.error('Failed to launch puppeteer-core. Did you provide PUPPETEER_EXECUTABLE_PATH to a local Chrome/Edge? Error:', err);
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

function ticketFilename(reg) {
  const safe = (reg.fullname || 'ticket').replace(/[^a-z0-9\-]/gi, '_').toLowerCase();
  return `${safe}-${Date.now()}.pdf`;
}

// basic HTML escaping to prevent broken output when replacing template tokens
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function renderTicketPdf(reg, outfile) {
  // Use a short-lived headless browser for PDF rendering so the interactive
  // browser used for WhatsApp automation isn't disturbed by PDF tasks.
  return enqueueBrowserTask(async () => {
    const template = fs.readFileSync(path.join(__dirname, 'templates', 'ticket.html'), 'utf8');
    // prepare logo data URL (look for project asset)
    let logoDataUrl = '';
    try {
      const logoPath = path.join(__dirname, '..', 'src', 'assets', 'kickstart-logo.png');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch (e) {
      console.warn('Failed to load logo asset', e && e.message ? e.message : e);
    }

    // generate QR code data URL for the ticket id
    const ticketId = outfile.split('-').slice(-1).join('-').replace('.pdf','');
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(`KICKSTART:${ticketId}`);
    } catch (e) {
      console.warn('Failed to generate QR code', e && e.message ? e.message : e);
    }

    let html = template.replace(/{{logoDataUrl}}/g, logoDataUrl)
      .replace(/{{qrDataUrl}}/g, qrDataUrl)
      .replace(/{{ticketId}}/g, escapeHtml(ticketId))
      .replace(/{{fullname}}/g, escapeHtml(reg.fullname || ''))
      .replace(/{{email}}/g, escapeHtml(reg.email || ''))
      .replace(/{{phone}}/g, escapeHtml(reg.phone || ''))
      .replace(/{{sector}}/g, escapeHtml(reg.sector || ''))
      .replace(/{{role}}/g, escapeHtml(reg.role || ''))
      .replace(/{{eventTitle}}/g, escapeHtml(process.env.EVENT_TITLE || 'Kickstart 2026'))
      .replace(/{{eventDate}}/g, escapeHtml(process.env.EVENT_DATE || 'TBA'))
      .replace(/{{eventVenue}}/g, escapeHtml(process.env.EVENT_VENUE || 'TBA'));

    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const launchOpts = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run', '--disable-session-crashed-bubble', '--disable-infobars', '--disable-extensions', '--disable-background-networking'] };
    if (execPath) launchOpts.executablePath = execPath;

    // try twice if there are transient failures
    for (let attempt = 0; attempt < 2; attempt++) {
      let tempBrowser = null;
      try {
        tempBrowser = await puppeteer.launch(launchOpts);
        const page = await tempBrowser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outfile, format: 'A5', printBackground: true });
        try { await page.close(); } catch (e) { }
        try { await tempBrowser.close(); } catch (e) { }
        return;
      } catch (err) {
        console.warn('renderTicketPdf (headless) attempt failed', err && err.message ? err.message : err);
        try { if (tempBrowser) await tempBrowser.close(); } catch (e) { }
        if (attempt === 1) throw err;
        await sleep(300);
      }
    }
  });
}

async function sendWhatsAppMessage(toNumber, messageText, filePath) {
  // serialize send tasks so multiple registrations don't race the browser
  return enqueueBrowserTask(async () => {
    // toNumber e.g. +27615266887 -> WhatsApp web expects numbers without plus in the UI chat search
    const plainNumber = toNumber.replace(/[^0-9]/g, '');
    // attempt send with one retry if connection closes
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const browser = await ensureBrowser();
        const page = await (await browser).newPage();
        await page.setViewport({ width: 1200, height: 900 });

        // Navigate to WhatsApp Web, wait for QR scan if needed
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
        // Wait for the main chat pane (means user is logged in)
        try {
          await page.waitForSelector('#pane-side, div[role="grid"], .app, [aria-label="Chat list" ]', { timeout: 60000 });
        } catch (e) {
          console.warn('WhatsApp pane not detected within timeout — user may need to scan QR');
        }

        // Close any download/upgrade overlay that might block the UI (best-effort)
        try {
          await page.keyboard.press('Escape');
          await sleep(400);
        } catch (e) { /* ignore */ }

        // Try several selectors for the search input - WhatsApp changes its DOM often
        const searchSelectors = [
          'div[title="Search or start new chat"]',
          'div[role="textbox"][contenteditable="true"][data-tab]',
          '._2_1wd.copyable-text.selectable-text',
          '._3FRCZ.copyable-text.selectable-text'
        ];

        let searchSel = null;
        for (const sel of searchSelectors) {
          try {
            await page.waitForSelector(sel, { timeout: 3000 });
            searchSel = sel;
            break;
          } catch (err) {
            // try next
          }
        }

        if (!searchSel) {
          console.warn('Search input not found using known selectors — falling back to URL chat open');
          // fallback: open chat using web URL
          try {
            // If there's a file to attach do not prefill the text via URL (it causes a separate text bubble on some clients).
            const url = filePath && fs.existsSync(filePath)
              ? `https://web.whatsapp.com/send?phone=${plainNumber}`
              : `https://web.whatsapp.com/send?phone=${plainNumber}&text=${encodeURIComponent(messageText || '')}`;
            await page.goto(url, { waitUntil: 'networkidle2' });
            await sleep(2000);
            // If file provided, we will attach via UI so we don't prefill text in the URL.
          } catch (e) {
            console.warn('Fallback web.whatsapp open failed', e);
          }
        } else {
          // Use the search input to open chat
          try {
            await page.click(searchSel);
            await sleep(200);
            await page.keyboard.type(plainNumber, { delay: 60 });
            await sleep(1200);
            await page.keyboard.press('Enter');
            await sleep(800);
          } catch (e) {
            console.warn('Failed to open chat via search input', e);
          }
        }

        // Attach file if provided
        if (filePath && fs.existsSync(filePath)) {
          try {
            // Try to click attach (paperclip) icon
            const attachSelectors = ['span[data-icon="clip"]', 'button[title="Attach"]', 'div[title="Attach"]'];
            let attachSel = null;
            for (const a of attachSelectors) {
              try { await page.waitForSelector(a, { timeout: 3000 }); attachSel = a; break; } catch (e) { }
            }
            if (attachSel) {
              await page.click(attachSel);
              await sleep(300);
            }

            // file input: choose the input that accepts documents (pdf) if present
            await sleep(300);
            const fileInputs = await page.$$('input[type=file]');
            if (!fileInputs || fileInputs.length === 0) throw new Error('No file input found after opening attach panel');

            let inputHandle = null;
            for (const h of fileInputs) {
              try {
                const acceptProp = await (await h.getProperty('accept')).jsonValue();
                const accept = acceptProp || '';
                // prefer an input that accepts pdf or any file
                if (accept.includes('pdf') || accept.includes('*/*') || accept.includes('application/pdf') || accept.includes('.pdf')) {
                  inputHandle = h;
                  break;
                }
              } catch (e) { /* ignore */ }
            }
            if (!inputHandle) inputHandle = fileInputs[fileInputs.length - 1];
            await inputHandle.uploadFile(filePath);
            await sleep(1200);

            // detect 'not supported' toast (best-effort) and log
            try {
              const bodyText = await page.evaluate(() => document.body.innerText || '');
              if (bodyText.toLowerCase().includes('not supported') || bodyText.toLowerCase().includes('file you tried adding is not supported')) {
                console.warn('WhatsApp reported the file type is not supported for upload');
              }
            } catch (e) { /* ignore */ }

            // optional caption: try to type in caption box if visible
            try {
              const captionSel = 'div[contenteditable="true"][data-tab]';
              await page.waitForSelector(captionSel, { timeout: 2000 });
              if (messageText) await page.type(captionSel, messageText, { delay: 10 });
            } catch (e) { /* ignore caption */ }

            // click send for the attachment
            const sendFileSelectors = ['span[data-icon="send"]', 'button[aria-label="Send"]'];
            for (const s of sendFileSelectors) {
              try { await page.waitForSelector(s, { timeout: 3000 }); await page.click(s); break; } catch (e) { }
            }
          } catch (e) {
            console.warn('Attachment/send flow failed', e);
          }
        } else if (messageText) {
          // send plain message
          try {
            const msgSelectors = ['div[contenteditable="true"][data-tab]', 'div[role="textbox"][contenteditable="true"]'];
            let msgSel = null;
            for (const m of msgSelectors) {
              try { await page.waitForSelector(m, { timeout: 3000 }); msgSel = m; break; } catch (e) { }
            }
            if (msgSel) {
              await page.type(msgSel, messageText, { delay: 10 });
              await page.keyboard.press('Enter');
            } else {
              console.warn('Could not find message input to type message');
            }
          } catch (e) {
            console.warn('Plain message send failed', e);
          }
        }

        await sleep(1500);
        try { await page.close(); } catch (e) { /* ignore */ }
        return;
      } catch (err) {
        console.warn('sendWhatsAppMessage attempt failed', err && err.message ? err.message : err);
        // reset browser and retry once
        browserPromise = null;
        if (attempt === 1) throw err;
        await sleep(500);
      }
    }
  });
}

app.get('/ticket/:name', (req, res) => {
  const name = req.params.name;
  const file = path.join(TMP_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.sendFile(file);
});

app.post('/register', async (req, res) => {
  try {
    console.log('Incoming register request', req.body);
    const { fullname, email, phone, sector, role } = req.body || {};
    if (!fullname || !email || !phone) return res.status(400).json({ error: 'fullname,email,phone required' });

    const reg = { fullname, email, phone, sector, role };
    const filename = ticketFilename(reg);
    const out = path.join(TMP_DIR, filename);
    await renderTicketPdf(reg, out);

    const organiserNumber = process.env.ORGANISER_WHATSAPP || '+27615266887';
    const participantNumber = phone;

    const messageText = `New registration:\nName: ${fullname}\nEmail: ${email}\nPhone: ${phone}\nSector: ${sector || '-'}\nRole: ${role || '-'}\nEvent: ${process.env.EVENT_TITLE || 'Kickstart 2026'}`;

    // By default attempt to auto-send WhatsApp messages via WhatsApp Web automation.
    // Set AUTOSEND_WHATSAPP=false in the .env to disable automated sends.
    if (process.env.AUTOSEND_WHATSAPP !== 'false') {
      // fire-and-forget to avoid blocking the HTTP response
      (async () => {
        try {
          await sendWhatsAppMessage(organiserNumber, messageText, out);
        } catch (e) {
          console.warn('Auto-send to organiser failed', e);
        }
        try {
          await sendWhatsAppMessage(participantNumber, `Thanks ${fullname}! Here is your ticket for ${process.env.EVENT_TITLE || 'Kickstart 2026'}.`, out);
        } catch (e) {
          console.warn('Auto-send to participant failed', e);
        }
      })();
    }

    // Prepare client-side WhatsApp links (wa.me) so browsers / mobiles can open WhatsApp directly.
    function makeWaMeLink(number, text) {
      if (!number) return null;
      const digits = String(number).replace(/[^0-9]/g, '');
      if (!digits) return null;
      const base = `https://wa.me/${digits}`;
      if (!text) return base;
      return `${base}?text=${encodeURIComponent(text)}`;
    }

    const host = process.env.HOST || `http://localhost:${PORT}`;
    const ticketUrl = `${host}/ticket/${encodeURIComponent(filename)}`;
    console.log('Ticket generated at', ticketUrl);

    const organiserWa = makeWaMeLink(organiserNumber, messageText);
    const participantWa = makeWaMeLink(participantNumber, `Thanks ${fullname}! Here is your ticket for ${process.env.EVENT_TITLE || 'Kickstart 2026'} - ${ticketUrl}`);

    // Return the file URL and wa.me links so the client can open them (open in new tab/window on mobile)
    res.json({ ok: true, ticketFilename: filename, ticketUrl, organiserWa, participantWa });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
