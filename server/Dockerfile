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

# Expose the port the app listens on
ENV PORT=3333

EXPOSE 3333

# Run the server. By default we run `node index.js` (no X display).
# If you enable WhatsApp automation (`AUTOSEND_WHATSAPP=true`) the container
# will start the server under `xvfb-run` so Puppeteer can launch a headful
# browser. This avoids Xvfb startup failures when the feature is disabled.
CMD sh -c "if [ \"$AUTOSEND_WHATSAPP\" = \"true\" ]; then xvfb-run -s '-screen 0 1280x720x24' node index.js; else node index.js; fi"
