const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginSchema, registerSchema } = require('../dto/authDto');
const validate = require('../middleware/validation');

const router = express.Router();

router.post('/auth/login', validate(loginSchema), authController.login);

router.post('/auth/register', validate(registerSchema), authController.register);

router.get('/auth/me', authenticate, authController.me);

module.exports = router;
