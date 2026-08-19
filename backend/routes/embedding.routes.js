const router = require('express').Router();
const ctrl = require('../controllers/embeddingController');
const { captureRawBody } = require('../utils/rawBody');

// Live Embed mode: GET for the initial load / link navigation, POST for
// framed <form> submits (the injected script resubmits the form directly
// at this route — see embeddingProxyService.js).
router.get('/proxy', ctrl.proxy);
router.post('/proxy', captureRawBody, ctrl.proxy);

// Background fetch()/XHR calls made by the framed page's own JS, so
// interactive/SPA-style state updates keep working from touch without
// leaving the slot.
router.all('/proxy-resource', captureRawBody, ctrl.proxyResource);

router.get('/screenshot', ctrl.screenshot);

module.exports = router;
