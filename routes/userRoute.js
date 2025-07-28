const express = require("express");
const userrouter = express.Router();

const { signup, login } = require("../controllers/authController");
const courseController = require("../controllers/courseController");
const paymentController = require("../controllers/paymentController");
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const {
  submitAnswers,
  getSubmission,
} = require("../controllers/answerController");

const {
  getAllQuestionPapers,
  getQuestionPaper,
  getQuestionPaperforPurchasedUser,
} = require("../controllers/questionPaperController");

userrouter.post("/signup", signup);
userrouter.post("/login", login);

userrouter.get("/courses", courseController.getAllCourses);

userrouter.get("/courses/:id", courseController.getCourseById);

userrouter.post("/submit-answers", protect, submitAnswers);
userrouter.get("/submission/:questionPaperId", protect, getSubmission);
userrouter.post("/create-order", protect, paymentController.createOrder);
userrouter.post("/verify", protect, paymentController.verifyPayment);
userrouter.get("/my-courses/:id", protect, courseController.getUserCourses);
userrouter.post(
  "/purchased-course-details/:id",
  courseController.getCourseDetails
);
userrouter.post(
  "/question-paper/:questionPaperId",
  getQuestionPaperforPurchasedUser
);

userrouter.get("/cart/:userId", protect, cartController.getCartItems);
userrouter.post("/cart/add", protect, cartController.addToCart);
userrouter.delete("/cart/remove", protect, cartController.removeFromCart);
module.exports = userrouter;
