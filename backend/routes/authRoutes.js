const express = require('express');
const router = express.Router();
const { login, logout, getProfile, getLoginHistory } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getProfile);
router.get('/login-history', authenticate, authorize('admin'), getLoginHistory);

module.exports = router;
