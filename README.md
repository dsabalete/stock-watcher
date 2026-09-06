# StockWatcher

Real-time stock watchlist built with [Nuxt](https://nuxt.com/) (Vue 3 + Tailwind CSS), powered by the [EODHD](https://eodhd.com/) market data API. Track tickers at a glance: company name, current price, and day change — with your watchlist persisted in the browser.

## Features

- **Watchlist dashboard** — card grid showing symbol, company name, price, currency, and day change/change %.
- **Add / remove symbols** — type a ticker (e.g. `AAPL`); the `.US` exchange suffix is appended automatically if omitted. Duplicates are rejected.
- **Persistent watchlist** — saved to `localStorage`; defaults to `AAPL.US, MSFT.US, GOOGL.US, TSLA.US` on first visit.
- **Batch quotes** — a single server endpoint fetches all symbols in one EODHD real-time request.
- **Company names** — the real-time endpoint returns no names, so the server enriches each quote via the EODHD Search API (with in-memory caching).
- **Dark UI** — Tailwind-based slate/indigo theme with green/red change indicators.

## Tech stack

- Nuxt 4 / Vue 3 / Tailwind CSS
- Nitro server routes (`server/api/`)
- EODHD Real-time + Search APIs
- Deployed on Netlify (`netlify.toml`, Nitro `netlify` preset)

## Setup

Install dependencies:

```bash
npm install
```

Configure your EODHD API key (see `.env.example`):

```bash
cp .env.example .env
# edit .env and set your key:
# NUXT_EODHD_KEY=your_eodhd_api_key_here
```

> The key lives only in server-side `runtimeConfig` (`nuxt.config.ts`) and is never exposed to the client. `.env` is git-ignored. On Netlify, set `NUXT_EODHD_KEY` under *Site settings → Environment variables*.

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

## API

### `GET /api/stocks?symbols=AAPL.US,MSFT.US`

Returns an array of quotes:

```json
[
  {
    "symbol": "AAPL.US",
    "name": "Apple Inc.",
    "price": 319.97,
    "change": -8.24,
    "changePercent": -2.5106,
    "currency": "USD",
    "previousClose": 328.21
  }
]
```

- `symbols` (required): comma-separated tickers in `TICKER.EXCHANGE` format (e.g. `AAPL.US`).
- A single symbol returns a one-element array; unknown/invalid symbols yield `[]`.
- Company `name`/`currency` come from the EODHD Search API; quotes come from the Real-time API.

## Project structure

```
app.vue               # Watchlist UI (single-file root component)
server/api/stocks.ts  # Batch quote endpoint + Search-API enrichment
server/api/stock.ts   # Legacy single-quote endpoint
nuxt.config.ts        # Runtime config (NUXT_EODHD_KEY), Tailwind, Netlify preset
netlify.toml          # Netlify build config
.env.example          # Required env var template
```
