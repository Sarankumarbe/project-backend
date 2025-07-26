const express = require("express");
const adminrouter = express.Router();

const { signup, login } = require("../controllers/authController");
const {
  uploadAndParseQuestions,
  saveQuestions,
} = require("../controllers/questionPaperController");
const { handleUpload } = require("../middleware/uploadMiddleware");
const courseController = require("../controllers/courseController");

adminrouter.post("/login", login);
adminrouter.post(
  "/upload-questions",
  handleUpload("file"),
  uploadAndParseQuestions
);
adminrouter.post("/save-questions", saveQuestions);

adminrouter.post("/courses", courseController.createCourse);
adminrouter.get("/courses", courseController.getAllCourses);
adminrouter.get("/courses/:id", courseController.getCourseById);
adminrouter.put("/courses/:id", courseController.updateCourse);
adminrouter.delete("/courses/:id", courseController.deleteCourse);

module.exports = adminrouter;
