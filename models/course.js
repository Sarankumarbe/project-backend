const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String }, // image URL
  price: { type: Number, required: true },
  questionPapers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
