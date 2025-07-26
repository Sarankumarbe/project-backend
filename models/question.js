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

module.exports = mongoose.model("Question", questionSchema);
