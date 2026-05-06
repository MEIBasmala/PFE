const express = require('express');
const router = express.Router();
const { refreshToken, logout } = require('./refresh.controller');

router.post('/', refreshToken);
router.post('/logout', logout);

module.exports = router;