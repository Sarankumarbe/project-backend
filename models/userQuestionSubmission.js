// models/userQuestionSubmission.js
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionNumber: String,
  selectedAnswer: String,
  isCorrect: Boolean,
  marksAwarded: Number,
});

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionPaper: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionPaper", required: true },
  answers: [answerSchema],
  totalMarks: Number,
  isSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
});

module.exports = mongoose.model("UserQuestionSubmission", submissionSchema);
