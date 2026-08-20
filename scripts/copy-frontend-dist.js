// Puts the built frontend where backend/app.js expects to serve it from
// (backend/frontend/dist) — see the "Serves the frontend's build output"
// comment there. Run after `npm run build --prefix frontend`.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', 'dist');
const dest = path.join(__dirname, '..', 'backend', 'frontend', 'dist');

if (!fs.existsSync(src)) {
  console.error(`[copy-frontend-dist] ${src} doesn't exist — did the frontend build run first?`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[copy-frontend-dist] copied ${src} -> ${dest}`);
