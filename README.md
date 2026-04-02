# LAMP – LinkedIn Article Management & Productivity

A lightweight web app to manage LinkedIn saved articles and summarize them with Claude.

## Features

- Save `li_at` LinkedIn session cookie locally in browser
- Save Anthropic API key locally in browser
- Fetch LinkedIn saved items (best-effort via LinkedIn Voyager endpoint)
- Summarize selected recent items with Claude Sonnet
- Mark summaries as done/ignored (persisted)
- All state stored in `localStorage`

## Run locally

```bash
node server.mjs
```

Then open `http://localhost:3000`.

> Do **not** open `public/index.html` directly with `file://...` in your browser.
> The app needs the local server so `/api/...` routes work.

## Notes

- LinkedIn has no official API endpoint for saved posts. This implementation uses a best-effort unofficial Voyager request through a local proxy.
- LinkedIn endpoint structure can change at any time.
