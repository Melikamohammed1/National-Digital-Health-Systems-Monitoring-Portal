# Mosaic Wall — Backend

Layered Express backend: `controllers` → `services` → `models` →
`database`, plus JWT authentication, request validation, centralized
error handling, and a WebSocket-based interactive remote-browser session
engine. Built to match the frontend's `src/services/api.js` contract
exactly, so connecting it is a one-line flag flip, not a rewrite.

---

## 🛠️ Getting Started

```bash
npm install
cp .env.example .env
npm start               # or: npm run dev  (auto-restarts on file changes)
```

Server runs at **http://localhost:4000**.

### Database — shared Turso, not a local file

This project uses a **shared remote database** (Turso/libSQL) so every
teammate sees the same screens, targets, users, and activity log — not
a separate copy on each machine.

**To connect to the shared database**, add these two lines to your own
`.env` (ask whoever set up the Turso project — currently Member 1 — for
the actual values over a private channel like Slack/DM, never a commit
or a public channel):

```
TURSO_DATABASE_URL=libsql://<the-project's-database-name>.turso.io
TURSO_AUTH_TOKEN=<the-auth-token>
```

That's it — no schema setup, no seeding, nothing else to run. The next
`npm start` connects straight to the shared data.

**If you leave both unset**, the backend transparently falls back to a
local SQLite file (`data.sqlite`, created next to `server.js`) — useful
for offline work or throwaway experiments, but changes there are only
visible to you, not the team. Delete that file to reset it to seed data.

`.env` is gitignored on purpose — **never commit real Turso credentials**.
Only `.env.example` (with no real values) belongs in git.

Requires **Node 22.5+** and the `@libsql/client` package (already in
`package.json` — installed by `npm install`, nothing extra to set up).

```bash
npm test                # runs tests/ via Node's built-in test runner
node test-puppeteer.js   # isolates Puppeteer/Chromium problems from app problems
```

Optional — only needed for live interactive sessions and admin-thumbnail
screenshots (downloads a ~200MB Chromium binary, so not installed by
default):

```bash
npm install puppeteer
```

---

## 📂 Project Directory Architecture

```text
backend/
├── config/
│   └── env.js                  # centralized environment variable loading
├── controllers/                 # request handlers — parse req, call a service, send res
│   ├── authController.js
│   ├── screensController.js
│   ├── targetsController.js
│   ├── embeddingController.js    # proxy + screenshot
│   └── monitoringController.js    # health + status
├── middleware/
│   ├── auth.js                  # requireAuth — JWT verification
│   ├── validate.js               # validateBody(['field', ...]) factory
│   ├── notFound.js                # 404 for unmatched /api routes
│   └── errorHandler.js             # centralized error → JSON response (must be last)
├── models/                      # data access ONLY — no business logic
│   ├── Screen.js
│   ├── Target.js
│   └── User.js
├── routes/                      # wires HTTP paths to controllers
│   ├── index.js                   # mounts everything under /api
│   ├── screens.routes.js
│   ├── targets.routes.js
│   ├── auth.routes.js
│   ├── embedding.routes.js
│   └── monitoring.routes.js
├── services/                    # business logic — the layer controllers call into
│   ├── screenService.js
│   ├── targetService.js
│   ├── authService.js
│   ├── embeddingProxyService.js   # Live Embed mode
│   ├── screenshotService.js        # admin-thumbnail screenshots
│   ├── interactiveSessionService.js # the WebSocket engine
│   └── browserService.js            # shared lazy Puppeteer instance
├── database/
│   ├── connection.js             # SQLite connection, schema, legacy-JSON migration
│   └── seed.js                    # seed data for a brand-new database (demo admin only)
├── utils/
│   ├── asyncHandler.js            # wraps async route handlers for error forwarding
│   ├── HttpError.js                # Error subclass carrying an HTTP status
│   ├── jwt.js                       # sign/verify wrapper
│   └── normalizeEmbedUrl.js          # YouTube/Vimeo embed-URL rewriting
├── tests/
│   ├── health.test.js
│   ├── screens.test.js
│   └── auth.test.js
├── app.js                        # Express config — no listening (importable by tests)
├── server.js                      # entry point — http server + WebSocket + listen()
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

**Why `app.js` and `server.js` are split:** `app.js` exports the
configured Express app without calling `.listen()`, so `tests/*.test.js`
can `require('../app')` and spin up an ephemeral server per test without
port conflicts or a real process running. `server.js` is the only file
that actually starts listening — it's what `npm start` runs.

**On storage:** `database/connection.js` connects via `@libsql/client` —
to the shared Turso database when `TURSO_DATABASE_URL` is set, or a
local SQLite file otherwise (same client, same SQL, just a different
transport). Every call is async now. Models talk to it directly with
SQL; controllers/services/routes never touch it. `init()` is idempotent
and must be awaited once before the first query (see `server.js` and
each test file's `test.before()` hook).

---

## 📡 API Reference

### Screens
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/screens` | — | List all |
| GET | `/api/screens/:id` | — | 404 if not found |
| POST | `/api/screens` | `{ name, layout?, passcode? }` | `name` required |
| PATCH | `/api/screens/:id` | `{ layout?, slots?, status?, ... }` | Partial update |
| POST | `/api/screens/:id/reconnect` | — | Sets status to `online` |
| DELETE | `/api/screens/:id` | — | 204 on success |

### Targets (externally-built systems)
| Method | Path | Body |
|---|---|---|
| GET | `/api/targets` | — |
| POST | `/api/targets` | `{ name, url, mode }` — `mode` is `iframe` or `interactive` |
| DELETE | `/api/targets/:key` | — |

### Embedding
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/proxy?url=` | Live Embed mode — strips framing-restriction headers |
| GET | `/api/screenshot?url=` | Single-frame screenshot (admin thumbnails) |
| WS | `/ws/interact` | Interactive Remote Session — live streamed browser + input forwarding |

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` | Returns `{ token, user }`. Seeded demo account: `admin` / `admin123` (see `.env.example`) |
| POST | `/api/auth/logout` | — | Stateless JWT — client just discards the token |
| GET | `/api/auth/me` | — | **Protected.** Requires `Authorization: Bearer <token>` |

### Monitoring
| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ status, uptimeSeconds, timestamp }` |
| GET | `/api/monitoring/status` | `{ totalScreens, online, standby, offline }` |

---

## Connecting the frontend

Same as before — this hasn't changed:

1. In the frontend, `src/services/api.js`: set `USE_MOCK = false`.
2. Dev: run this backend (`npm start`, `:4000`) and the frontend
   (`npm run dev`, `:5173`) side by side — `vite.config.js` already
   proxies `/api` and `/ws` to `:4000`.
3. Production: `npm run build` the frontend, copy `dist/` into
   `./frontend/dist` here, then just `npm start` — one origin, no proxy.

### Important: auth is not wired to the frontend yet — on purpose

This backend now has a **real, working** auth system — JWT, bcrypt,
`/api/auth/login`, protected-route middleware, all tested. But
`/api/screens` and `/api/targets` are **deliberately not** behind
`requireAuth` yet, because the frontend's `AuthContext` is still the
client-side-only placeholder that never calls a backend endpoint or
attaches a token. Protecting those routes now would mean flipping
`USE_MOCK = false` instantly breaks the whole app with 401s.

When you're ready to close that gap, it's a small, contained change:

**1. Frontend — `src/context/AuthContext.jsx`:** replace the placeholder
`login()` body with a real call:
```js
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
if (!res.ok) throw new Error((await res.json()).error);
const { token, user } = await res.json();
localStorage.setItem('ndhs_token', token); // alongside the existing user storage
setUser(user);
```

**2. Frontend — `src/services/api.js`:** attach the token to every
request:
```js
const token = localStorage.getItem('ndhs_token');
const res = await fetch(path, {
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  ...opts
});
```

**3. Backend — `routes/screens.routes.js` and `routes/targets.routes.js`:**
add `requireAuth` to whichever routes should require it:
```js
const requireAuth = require('../middleware/auth');
router.use(requireAuth); // protects every route below this line in the file
```

Do all three together, not one at a time — doing only step 3 first locks
the frontend out; doing only steps 1–2 first just means the token is
fetched and stored but nothing checks it yet (harmless, but pointless on
its own).

---

## Known limitations

- JWT "logout" is stateless — no server-side token invalidation
  (blacklist/refresh-token rotation) yet. Fine for this phase; worth
  revisiting before production if session revocation matters.
- Storage is SQLite via Node's built-in `node:sqlite`, which Node itself
  still flags as an experimental API (stable behavior, but the API shape
  could change in a future Node release). A single SQLite file is also
  still single-writer — fine for one backend instance, not a fit for
  multiple instances behind a load balancer without moving to a
  client-server database (Postgres, etc.) at that point.
- The embedding proxy (`/api/proxy`) is best-effort — it can't defeat
  JavaScript frame-busting. Use Interactive Remote Session (`/ws/interact`)
  for sites that actively fight embedding.
- `JWT_SECRET` defaults to an insecure placeholder in dev — the console
  won't warn you, so double-check `.env` sets a real one before deploying
  anywhere reachable.
