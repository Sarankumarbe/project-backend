const express = require("express");
const adminrouter = express.Router();

const { signup, login } = require("../controllers/authController");
const {
  uploadAndParseQuestions,
  saveQuestions,
  getAllQuestionPapers,
  getQuestionPaper,
  updateQuestionPaper,
  deleteQuestionPaper,
} = require("../controllers/questionPaperController");
const { handleUpload } = require("../middleware/uploadMiddleware");

adminrouter.get("/question-papers", getAllQuestionPapers);
adminrouter.get("/question-paper/:id", getQuestionPaper);

adminrouter.post("/login", login);
adminrouter.post(
  "/upload-questions",
  handleUpload("file"),
  uploadAndParseQuestions
);
adminrouter.post("/save-questions", saveQuestions);

adminrouter.put("/update-question-paper/:id", updateQuestionPaper);

adminrouter.put("/delete-question-paper/:id", deleteQuestionPaper);

module.exports = adminrouter;
