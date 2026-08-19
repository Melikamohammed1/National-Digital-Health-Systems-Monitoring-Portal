const router = require('express').Router();
const ctrl = require('../controllers/monitoringController');

router.get('/health', ctrl.health);
router.get('/monitoring/status', ctrl.status);

module.exports = router;
