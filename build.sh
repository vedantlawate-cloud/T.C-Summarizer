#!/usr/bin/env bash
# Builds store-ready zips: dist/tc-summarizer-chrome-edge.zip and dist/tc-summarizer-firefox.zip
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/chrome dist/firefox
for t in chrome firefox; do
  cp -r extension/popup.html extension/popup.js extension/config.js extension/icons dist/$t/
done
cp extension/manifest.json dist/chrome/manifest.json
cp extension/manifest.firefox.json dist/firefox/manifest.json
(cd dist/chrome  && zip -qr ../tc-summarizer-chrome-edge.zip .)
(cd dist/firefox && zip -qr ../tc-summarizer-firefox.zip .)
echo "Built: dist/tc-summarizer-chrome-edge.zip, dist/tc-summarizer-firefox.zip"
