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
const {
  handleUpload,
  handleImageUpload,
} = require("../middleware/uploadMiddleware");
const courseController = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/authMiddleware");


adminrouter.get("/question-papers", getAllQuestionPapers);
adminrouter.get("/question-paper/:id", getQuestionPaper);

adminrouter.post("/login", login);
adminrouter.post(
  "/upload-questions",
  handleUpload("file"),
  uploadAndParseQuestions
);
adminrouter.post("/save-questions", saveQuestions);

adminrouter.post(
  "/courses",
  protect,
  adminOnly,
  handleImageUpload("image"),
  courseController.createCourse
);

adminrouter.get(
  "/courses",
  protect,
  adminOnly,
  courseController.getAllCourses
);

adminrouter.get(
  "/courses/:id",
  protect,
  adminOnly,
  courseController.getCourseById
);

adminrouter.put(
  "/courses/:id",
  protect,
  adminOnly,
  handleImageUpload("image"),
  courseController.updateCourse
);

adminrouter.delete(
  "/courses/:id",
  protect,
  adminOnly,
  courseController.deleteCourse
);


adminrouter.put("/update-question-paper/:id", updateQuestionPaper);

adminrouter.put("/delete-question-paper/:id", deleteQuestionPaper);

module.exports = adminrouter;
