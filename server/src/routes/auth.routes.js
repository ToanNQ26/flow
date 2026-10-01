const router = require('express').Router();
const { login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public
router.post('/login', login);

// Protected
router.get('/me', authenticate, getMe);

module.exports = router;
