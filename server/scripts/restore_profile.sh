#!/bin/sh
set -e

URL="$1"
DEST="${PUPPETEER_USER_DATA_DIR:-/tmp/puppeteer_profile}"
TMP="/tmp/profile.tgz"

if [ -z "$URL" ]; then
  echo "Usage: $0 <url-to-profile-tgz>"
  exit 1
fi

echo "Destination user-data dir: $DEST"
mkdir -p "$DEST"

# Download
if command -v curl >/dev/null 2>&1; then
  echo "Downloading with curl..."
  curl -L -o "$TMP" "$URL"
elif command -v wget >/dev/null 2>&1; then
  echo "Downloading with wget..."
  wget -O "$TMP" "$URL"
else
  echo "curl or wget is required to download the profile tarball"
  exit 1
fi

# Extract
echo "Extracting to $DEST"
# The tarball should contain the profile directory contents (e.g. Default/)
tar -xzf "$TMP" -C "$DEST"
rm -f "$TMP"

# Try to set permissive ownership (may fail on some hosts)
if command -v chown >/dev/null 2>&1; then
  chown -R node:node "$DEST" || true
fi

echo "Profile restored to $DEST"
exit 0
