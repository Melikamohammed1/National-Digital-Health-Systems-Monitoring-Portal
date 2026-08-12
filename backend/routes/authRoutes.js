const express = require('express');
const router = express.Router();
const { login, logout, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getProfile);

module.exports = router;
