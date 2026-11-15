const express = require('express');
const { register, login,showHome,logout } = require('../controllers/authController');

const router = express.Router();

router.get('/', showHome);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);


module.exports = router;