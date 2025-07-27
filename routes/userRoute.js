const express = require('express');
const userrouter = express.Router();

const { signup, login } = require('../controllers/authController');
const courseController = require("../controllers/courseController");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const {
  submitAnswers,
  getSubmission,
} = require("../controllers/answerController");

const {
    getAllQuestionPapers,
    getQuestionPaper,
  } = require("../controllers/questionPaperController");


userrouter.post('/signup', signup);
userrouter.post('/login', login);

userrouter.get(
  "/courses",
  courseController.getAllCourses
);

userrouter.get(
  "/courses/:id",
  courseController.getCourseById
);

userrouter.get("/question-papers", getAllQuestionPapers);
userrouter.get("/question-paper/:id", getQuestionPaper);

userrouter.post("/submit-answers", protect, submitAnswers);
userrouter.get("/submission/:questionPaperId", protect, getSubmission);
userrouter.post("/create-order", protect, paymentController.createOrder);
userrouter.post("/verify", protect, paymentController.verifyPayment);
userrouter.get("/my-courses", protect, courseController.getUserCourses);

module.exports = userrouter;
