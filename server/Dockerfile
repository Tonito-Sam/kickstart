FROM node:20-bullseye-slim

# Install Chromium and minimal dependencies for headless operation
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
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

CMD ["node", "index.js"]
