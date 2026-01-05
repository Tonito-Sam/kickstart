FROM node:20-bullseye-slim

# Minimal image: PDF generation uses PDFKit (pure Node) so Chromium/Xvfb
# are not required. Keep the image small and simple for Render.

WORKDIR /app

# Copy package files and install production deps
# When Render builds with Root Directory = server the build context is the server folder,
# so package*.json are available at the Docker build root. Copy them and install.
COPY package*.json ./
RUN npm install --production

# Copy the server source into the image
COPY . /app

# Ensure production mode by default in the container
ENV NODE_ENV=production

# The container will use the port provided by the environment at runtime
# (Render sets `PORT`, so we don't hardcode it here). Remove EXPOSE/ENV
# to avoid confusing defaults — the app reads `process.env.PORT || 3333`.

# Run the server. By default we run `node index.js` (no X display).
# If you enable WhatsApp automation (`AUTOSEND_WHATSAPP=true`) the container
# will start the server under `xvfb-run` so Puppeteer can launch a headful
# browser. This avoids Xvfb startup failures when the feature is disabled.
CMD ["node", "index.js"]
