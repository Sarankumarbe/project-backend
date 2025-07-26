const express = require("express");
const adminrouter = express.Router();

const { signup, login } = require("../controllers/authController");

adminrouter.post("/login", login);

module.exports = adminrouter;
