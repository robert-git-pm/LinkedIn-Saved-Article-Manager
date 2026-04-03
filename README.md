# LAMP – LinkedIn Article Management & Productivity

A web app to manage LinkedIn saved articles and summarize them with Claude AI.

## Features

- Save `li_at` LinkedIn session cookie locally in browser
- Save Anthropic API key locally in browser
- Fetch LinkedIn saved items via LinkedIn Voyager endpoint
- Summarize articles with Claude Sonnet 4.6 (key takeaways + summary)
- Mark summaries as done/dismissed (persisted across sessions)
- Filter articles: Active / Dismissed / All
- Time range selector (3 / 7 / 14 / 30 days)
- Onboarding wizard for first-time setup
- All state stored in `localStorage`

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Claude Sonnet 4.6** for AI summarization
- **LinkedIn Voyager API** (via server-side proxy route)

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

Deploy to Vercel for the easiest setup:

```bash
npm run build
```

## Notes

- LinkedIn has no official API endpoint for saved posts. This implementation uses the unofficial Voyager API through a Next.js API route proxy.
- LinkedIn endpoint structure can change at any time.
- The `li_at` cookie typically stays valid for ~1 year but may need to be refreshed.
