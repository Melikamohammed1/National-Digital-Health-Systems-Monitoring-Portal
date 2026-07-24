# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

## 📂 Project Directory Architecture (`/frontend`)

```text
frontend/
├── public/                  # Static public assets, favicons, and branding icons
├── src/
│   ├── assets/              # Static images, logos (Ministry of Health), and SVG icons
│   ├── components/          # Modular and reusable UI components
│   │   ├── common/          # Low-level UI elements (Buttons, Inputs, Badges, Modals, Cards)
│   │   ├── layout/          # Main application framing (Header, Sidebar, Navigation Shell)
│   │   └── orchestrator/    # Screen cards, slot selectors, live preview containers
│   ├── context/             # Global React Context stores (Auth state, UI Layout presets, Active view)
│   ├── pages/               # Main application pages/routes
│   │   ├── Login.jsx        # User login and credential entry page
│   │   ├── Orchestrator.jsx # Admin interface for managing physical screens & grid slots
│   │   └── LiveDisplay.jsx  # Dynamic multi-slot iframe renderer view
│   ├── services/            # API client calls and mock data providers
│   ├── styles/              # Global CSS stylesheets and Tailwind configuration
│   ├── utils/               # Formatters, URL helpers, and layout grid calculators
│   ├── App.jsx              # Core application router and provider wrapper
│   └── main.jsx             # React entry point
├── .gitignore
├── package.json
└── README.md
```

## Current Sprint Focus: Frontend Development Phase

Development for this phase is dedicated entirely to building out the user interface components and pages.

### Frontend Key Deliverables

#### Authentication UI (`/login`)

- Login form with input validation and session context handling.

#### Dynamic Screen Orchestrator UI (`/admin/orchestrator`)

##### Sidebar Navigation

- Quick access links for Control Hub, System Inventory, and Access Keys.

##### Screen Registration Cards

- Status overview panels tracking registered screens (Online, Standby, Offline).

##### Layout Switcher

- Controls to set screen layout configurations:
  - Single
  - 2x2 Grid
  - 3-Column
  - Custom

##### Slot Mapping Interface

- Configurable dropdowns to assign specific health dashboard URLs to display slots.

##### Live Thumbnail Preview

- Interactive side-panel visualizing slot arrangement in real time.

#### Live Display Screen View (`/display`)

- Dynamic multi-panel container rendering target websites via responsive iframes.
- Configurable automatic refresh interval mechanism and individual panel header controls.[cite: 1]

#### Reusable UI Component Library

- Standardized design tokens.
- Status indicator badges (Online/Standby/Offline).
- Custom control buttons.[cite: 1]

---

## 🛠️ Getting Started

### Prerequisites

- Node.js: v18.0.0 or higher
- npm: v9.0.0 or higher

### Local Setup Instructions

Navigate to the frontend directory:

```bash
cd frontend
```

Install project dependencies:

```bash
npm install
``` 

Start the local Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser to view the application.

---

## 🤝 Collaboration & Git Workflow Guidelines

To ensure clean coordination among frontend team members, strictly follow these git practices.

### Branch Naming Conventions

Always create dedicated feature branches from `main`.

```text
feat/login-page
feat/screen-orchestrator-ui
feat/live-grid-display
feat/ui-components-badges
```

### Development Steps

Pull the latest changes:

```bash
git checkout main
git pull origin main
```

Create your feature branch:

```bash
git checkout -b feat/your-feature-name
```

Commit changes locally using standard prefixes.

- **feat:** for new UI components or routes.
- **fix:** for layout or logic bug fixes.
- **style:** for CSS, styling, or formatting updates.

Example:

```bash
git commit -m "feat(orchestrator): create layout selection button group"
```

Push your branch and submit a Pull Request:

```bash
git push origin feat/your-feature-name
```

---

## Design System Tokens

### Primary Colors

- Deep Navy (`#0F172A`)
- Primary Blue (`#2563EB`)

### Status Badges

- 🟢 Online: Green (`#22C55E`) [cite: 1]
- 🟡 Standby: Amber (`#F59E0B`) [cite: 1]
- 🔴 Offline: Red (`#EF4444`) [cite: 1]

### Typography

- System Sans-Serif
- Inter
