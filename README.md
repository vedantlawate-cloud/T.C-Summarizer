# T&C Summarizer: production setup

## 1. Deploy the backend (Cloudflare Workers; free plan is enough to start)
```bash
cd backend
npx wrangler login
npx wrangler kv namespace create RATE        # copy the id into wrangler.toml
npx wrangler secret put GEMINI_API_KEY       # paste your key from Google AI Studio
npx wrangler deploy                          # prints your URL: https://tc-summarizer-api.<you>.workers.dev
```

## 2. Point the extension at it
Replace `YOURNAME` in three places: `extension/config.js`, `extension/manifest.json`,
`extension/manifest.firefox.json` (host_permissions must be your exact domain, not a wildcard).
Also set a real `gecko.id` in the Firefox manifest.

## 3. Build and test locally
```bash
./build.sh
```
- Chrome/Edge: `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome`
- Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/firefox/manifest.json`

## 4. Publish
- Chrome Web Store ($5 one-time) and Edge Add-ons (free): upload `dist/tc-summarizer-chrome-edge.zip`
- Firefox Add-ons (free): upload `dist/tc-summarizer-firefox.zip`
- Safari: `xcrun safari-web-extension-converter dist/chrome` on a Mac (needs Apple Developer account, $99/yr)
- Each store needs screenshots, a description, and a hosted privacy policy URL (template: PRIVACY.md).

## Before public launch
- **Enable billing on your Gemini project.** The free tier has small shared limits and may use prompts to improve Google products; the paid tier does not.
- Confirm `MODEL` in wrangler.toml is still available (Google renames/retires models).
- Watch Cloudflare and Google usage for the first week; adjust `DAILY_LIMIT`.
- Install-ID limiting is soft (reinstalling resets it); the IP limit is the backstop.
