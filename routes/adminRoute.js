const express = require("express");
const adminrouter = express.Router();

const { signup, login } = require("../controllers/authController");
const {
  uploadAndParseQuestions,
  saveQuestions,
} = require("../controllers/questionPaperController");
const { handleUpload } = require("../middleware/uploadMiddleware");

adminrouter.post("/login", login);
adminrouter.post(
  "/upload-questions",
  handleUpload("file"),
  uploadAndParseQuestions
);
adminrouter.post("/save-questions", saveQuestions);

module.exports = adminrouter;
