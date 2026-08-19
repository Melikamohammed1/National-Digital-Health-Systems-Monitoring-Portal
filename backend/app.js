const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serves the frontend's build output once it's copied in — see README.
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

app.use('/api', apiRoutes);
app.use('/api', notFound); // only reached if nothing in apiRoutes matched

// SPA fallback — anything that isn't /api or /ws serves the built
// frontend's index.html, so client-side routes like /login and
// /display/:id work on direct load or refresh, not just in-app navigation.
app.get(/^(?!\/api|\/ws).*/, (req, res) => {
  const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res
      .status(404)
      .send('Frontend build not found. Run "npm run build" in your frontend project and copy dist/ here as ./frontend/dist — see README.');
  }
  res.sendFile(indexPath);
});

app.use(errorHandler); // must be last

module.exports = app;
