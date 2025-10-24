# Kickstart Server

Small Node/Express server to accept registrations, render an A5 PDF ticket using Puppeteer, and send the ticket + registration details via WhatsApp Web (automated in a headful browser).

Important: this approach uses an automated browser to control WhatsApp Web. You must scan the WhatsApp Web QR code once in the launched browser. This is not a production-grade integration but matches the requirement to avoid paid providers.

Setup

1. From the `server/` folder install dependencies:

```powershell
cd server
npm install
```

2. Create a `.env` file (see `.env.example`) and set values.

3. Start the server:

```powershell
npm start
```

4. Open `http://localhost:3333/health` to verify server running. The first time you hit `/register` the headful browser will open and you'll need to scan the QR in WhatsApp Web.

Notes about Puppeteer and Chromium

- This project uses `puppeteer-core` to avoid downloading Chromium at `npm install` time. You must point `PUPPETEER_EXECUTABLE_PATH` in your `.env` to a local Chrome or Edge executable. Example on Windows:

	PUPPETEER_EXECUTABLE_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe

- Optionally set `PUPPETEER_USER_DATA_DIR` to a folder where the browser profile will be stored between runs (recommended so you only need to scan the QR once).

- If you prefer to let Puppeteer download Chromium automatically, replace `puppeteer-core` with `puppeteer` in `package.json` and run `npm install`, but note this downloads a Chromium binary (~100MB+).


Usage

POST /register

JSON body: { fullname, email, phone, sector, role }

Response: { ok: true, ticket: "/absolute/path/to/tmp/ticket.pdf" }

Notes and limitations
- Automating WhatsApp Web can be brittle; UI selectors may change. If sending fails, inspect the opened browser to debug the flow.
- Puppeteer downloads Chromium (may be large). Ensure your environment can run headful Chromium.
- Consider production alternatives: Meta WhatsApp Cloud API or Twilio.
