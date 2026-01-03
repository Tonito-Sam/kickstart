# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7c020c33-fc7a-4dfd-978a-48d121a85fed

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7c020c33-fc7a-4dfd-978a-48d121a85fed) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7c020c33-fc7a-4dfd-978a-48d121a85fed) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Deploying the server on Render (Docker / Puppeteer)

If you plan to run Puppeteer (Chromium) on Render so the server can auto-send WhatsApp messages, deploy the server as a Docker Web Service with Root Directory set to `server`.

Quick checklist:

- Root Directory: `server`
- Dockerfile path: `server/Dockerfile` (already included in this repo)
- Branch: `main`
- Environment variables (set these in the Render dashboard for the service):
	- `AUTOSEND_WHATSAPP` — `true` to enable automation, `false` to disable
	- `PUPPETEER_EXECUTABLE_PATH` — `/usr/bin/chromium`
	- `PUPPETEER_USER_DATA_DIR` — persistent path (recommended to use a Render Disk), e.g. `/var/render/disks/puppeteer_profile`
	- `PORT` — `3333`
	- `HOST` — the public URL of the Docker service (update after deploy)

Persistent WhatsApp sessions
- WhatsApp Web stores login state inside the Chromium user-data directory. To keep the session across restarts you must attach a persistent disk to the Render service and set `PUPPETEER_USER_DATA_DIR` to the disk mount path.

Seeding a Puppeteer profile (recommended workflow)

1. Locally (on your development machine) create a tarball of a logged-in Chrome/Chromium profile folder:

	 - macOS / Linux example (adjust path to your Chrome profile):

		 ```bash
		 tar -czf profile.tgz -C "/path/to/Chrome/User Data" Default
		 ```

	 - Windows (PowerShell example, adjust path):

		 ```powershell
		 cd "%LOCALAPPDATA%\Google\Chrome\User Data"
		 tar -czf profile.tgz Default
		 ```

2. Upload `profile.tgz` to a place the Render instance can download from (private object storage, GitHub release asset, or an S3-compatible URL).

3. Use the Render Shell for the Docker service to download and extract the profile onto the attached disk. This repo includes a helper script at `server/scripts/restore_profile.sh` that you can run inside the container:

	 ```bash
	 # from Render Shell or via `render shell` (adjust URL and dest as needed)
	 /bin/sh /app/scripts/restore_profile.sh "https://example.com/profile.tgz"
	 ```

4. Ensure file permissions are correct and restart the service. With the profile present, Puppeteer should be able to use the stored WhatsApp Web session to send messages automatically.

Notes and cautions
- Storing and reusing authenticated browser profiles has security implications; treat the profile tarball as a sensitive artifact.
- Automating WhatsApp Web can be fragile and may break if WhatsApp changes the UI. Monitor logs for failures and rate-limiting.
- If you prefer not to manage profiles yet, keep `AUTOSEND_WHATSAPP=false` and rely on client-side wa.me links for users to open WhatsApp manually.

