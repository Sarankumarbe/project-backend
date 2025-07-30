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
const {
  getAllPayments,
  getPaymentStats,
} = require("../controllers/paymentController");
const userController = require('../controllers/userController');
const couponController = require("../controllers/couponController");


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

adminrouter.get("/courses", protect, adminOnly, courseController.getAllCourses);
adminrouter.get("/payments", protect, adminOnly, getAllPayments);
adminrouter.get("/payments/stats", protect, adminOnly, getPaymentStats);

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

adminrouter.delete("/delete-question-paper/:id", deleteQuestionPaper);

adminrouter.get('/manage', protect, adminOnly, userController.getAllUsers);
adminrouter.get('/manage/:id', protect, adminOnly, userController.getUserById);
adminrouter.put('/manage/:id', protect, adminOnly, userController.updateUser);
adminrouter.delete('/manage/:id', protect, adminOnly, userController.deleteUser);

adminrouter.post('/manage/reset-password', protect, adminOnly, userController.resetPassword);
adminrouter.patch('/manage/:id/status', protect, adminOnly, userController.toggleStatus);

adminrouter.post("/coupon", protect, adminOnly, couponController.createCoupon);
adminrouter.get("/coupon", couponController.getAllCoupons);
adminrouter.get("/coupon/:code", couponController.getCouponByCode); // public use
adminrouter.put("/coupon/:id", protect, adminOnly, couponController.updateCoupon);
adminrouter.delete("/coupon/:id", protect, adminOnly, couponController.deleteCoupon);

module.exports = adminrouter;
