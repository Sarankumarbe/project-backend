// models/questionPaper.js
const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text: String,
  image: String,
});

const questionSchema = new mongoose.Schema({
  questionNumber: String,
  questionText: String,
  questionImage: String,
  options: {
    A: optionSchema,
    B: optionSchema,
    C: optionSchema,
    D: optionSchema,
    E: optionSchema,
  },
  correctAnswer: String,
  difficulty: String,
  explanation: String,
  marks: Number,
  negativeMarks: Number,
  hasImages: Boolean,
});

const questionPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QuestionPaper", questionPaperSchema);
