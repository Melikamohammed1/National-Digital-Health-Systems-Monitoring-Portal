# Mosaic Wall — Frontend

React + Vite + Tailwind CSS admin dashboard and kiosk display for the National Digital Health Systems Monitoring Portal. See the [root README](../README.md) for setup/run instructions — this covers what's actually in here.

## Pages

| Route | Component | Who sees it |
|---|---|---|
| `/login` | `pages/Login.jsx` | Anyone |
| `/admin/orchestrator` | `pages/Orchestrator.jsx` | Signed-in users (Admin gets full control, Viewer gets read-only) |
| `/display/:screenId` | `pages/LiveDisplay.jsx` | Public, no login — this is what the physical kiosk screen shows |

## Structure

```
src/
├── pages/                    route-level components (Login, Orchestrator, LiveDisplay)
├── components/
│   ├── layout/                Header, Sidebar
│   ├── orchestrator/           screen cards, add-system modal, user management, activity log
│   ├── display/                the three dashboard rendering modes (iframe/screenshot/interactive)
│   └── common/                 Button, Modal, Toast, StatusBadge — generic UI primitives
├── context/                   AuthContext (login/session), ToastContext (notifications)
├── services/                  api.js (backend client), targetHelpers.js, mockData.js
├── utils/                     gridHelpers.js (layout math), devicePresets.js, urlHelpers.js
└── styles/                    global Tailwind entry point
```

## Mock mode

`src/services/api.js` exports `USE_MOCK`. When `true`, every API call reads/writes an in-memory array instead of hitting the real backend — useful for frontend-only work with no server running. It's currently `false` (talking to the real backend). Every exported function has the same name/signature in both modes, so components never branch on `USE_MOCK` themselves.

## Talking to the backend

`vite.config.js` proxies `/api` and `/ws` requests to `http://localhost:4000` during development — no CORS setup needed, no need to hardcode a backend URL anywhere in the code.

## Display modes

A dashboard assigned to a screen slot renders one of three ways, chosen when it's added:

- **Interactive Remote Session** — a real browser tab runs server-side and streams live over WebSocket; touch/mouse/keyboard get relayed back. Works on any site, including ones that block iframes.
- **Live Embed** — a real iframe, proxied through the backend to strip framing-restriction headers.
- **Auto-Refresh Screenshot** — a periodic snapshot on a configurable interval. Lightest weight, not interactive.
