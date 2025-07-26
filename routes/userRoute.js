const express = require('express');
const userrouter = express.Router();

const { signup, login } = require('../controllers/authController');

userrouter.post('/signup', signup);
userrouter.post('/login', login);

module.exports = userrouter;
