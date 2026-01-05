FROM node:20-bullseye-slim

# Install Chromium, Xvfb and minimal dependencies needed to run a headful
# Chromium inside a container. Xvfb provides a virtual X server so the
# app can launch a non-headless browser (useful for WhatsApp Web automation).
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  xvfb \
  xauth \
  ca-certificates \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libnspr4 \
  libnss3 \
  libatk1.0-0 \
  libcups2 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libasound2 \
  libgbm1 \
  libpangocairo-1.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production deps
# When Render builds with Root Directory = server the build context is the server folder,
# so package*.json are available at the Docker build root. Copy them and install.
COPY package*.json ./
RUN npm install --production

# Copy the server source into the image
COPY . /app

# Expose the port the app listens on
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=3333

EXPOSE 3333

# Run the server. By default we run `node index.js` (no X display).
# If you enable WhatsApp automation (`AUTOSEND_WHATSAPP=true`) the container
# will start the server under `xvfb-run` so Puppeteer can launch a headful
# browser. This avoids Xvfb startup failures when the feature is disabled.
CMD sh -c "if [ \"$AUTOSEND_WHATSAPP\" = \"true\" ]; then xvfb-run -s '-screen 0 1280x720x24' node index.js; else node index.js; fi"
