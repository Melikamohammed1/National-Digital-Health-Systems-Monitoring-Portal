# National Digital Health Systems Monitoring Portal

Working name of the deployed build: **Mosaic Wall**.

A web-based portal that pulls multiple system dashboards into one browser view, for monitoring and stakeholder demonstration — replacing a workflow built on individual AnyDesk remote-desktop sessions.

**Security note:** this project never connects to real Ministry of Health systems or data. Every monitored dashboard is a public, open-source demo instance (DHIS2 Play, OpenMRS, Grafana Play, WHO Global Health Observatory, OpenStreetMap, Wikipedia, Our World in Data).

## Project layout

```
backend/    Express API + WebSocket server (Node.js, SQLite)
frontend/   React + Vite admin dashboard and kiosk display
```

Each has its own `package.json` — they're not a single npm workspace, just two independent projects that talk to each other over HTTP.

## Requirements

- **Node.js 22.5 or newer.** The backend uses Node's built-in `node:sqlite` module, which doesn't exist on older versions — you'll get a hard crash on startup otherwise, not a warning.
- npm (comes with Node)

## Setup

```bash
npm run install:all
```

This installs both `backend/` and `frontend/` dependencies in one step (equivalent to running `npm install` in each folder separately).

**One extra step for the backend:** Puppeteer (used for interactive remote sessions and screenshot-mode dashboards) doesn't always download its Chrome binary automatically. If you see `Could not find Chrome` when using an interactive/screenshot target, run:

```bash
cd backend
npx puppeteer browsers install chrome
```

## Running it

```bash
npm run dev
```

Starts both servers together — backend on `:4000`, frontend on `:5173`. Open `http://localhost:5173`.

(`npm run dev:backend` / `npm run dev:frontend` run just one side, if you only need that.)

## First login

A demo admin account is seeded automatically on first run:

- **Username:** `admin`
- **Password:** `admin123`

(Change these via `DEMO_ADMIN_USERNAME` / `DEMO_ADMIN_PASSWORD` in `backend/.env` — copy `backend/.env.example` to get started. Sensible defaults work without a `.env` file at all.)

The database (`backend/data.sqlite`) is created fresh and empty on first run — no screens or dashboards are pre-loaded. Log in and use **+ Register New Physical Screen** / **+ Add New System** to set some up.

## More detail

- [`backend/README.md`](backend/README.md) — API reference, architecture, known limitations
- [`frontend/README.md`](frontend/README.md) — pages, mock-data mode, dev proxy setup
