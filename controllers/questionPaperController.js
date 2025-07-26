// controllers/questionPaperController.js
const questionPaperHelper = require("../helper/questionPaperHelper");
const Question = require("../models/question");

exports.uploadAndParseQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const questions = await questionPaperHelper.processQuestionPaper(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: "Question paper parsed successfully",
      questions,
    });
  } catch (error) {
    console.error("Error processing question paper:", error);
    res.status(500).json({
      error: "Error processing question paper",
      details: error.message,
    });
  }
};

exports.saveQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: "Missing required fields: questions array is required",
      });
    }

    // Validate each question
    const validationErrors = [];
    const validQuestions = questions.map((q, index) => {
      if (!q.questionText || !q.correctAnswer) {
        validationErrors.push(`Question ${index + 1} missing required fields`);
        return null;
      }

      // Validate options
      const validOptions = {};
      ["A", "B", "C", "D", "E"].forEach((opt) => {
        if (!q.options[opt]?.text) {
          validationErrors.push(`Question ${index + 1} missing option ${opt}`);
        }
        validOptions[opt] = {
          text: q.options[opt]?.text || "",
          image: q.options[opt]?.image || null,
        };
      });

      return {
        questionNumber: q.questionNumber || `Q${index + 1}`,
        questionText: q.questionText,
        questionImage: q.questionImage || null,
        options: validOptions,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || "Medium",
        explanation: q.explanation || "",
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0.25,
        hasImages: q.hasImages || false,
      };
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation errors",
        details: validationErrors,
      });
    }

    // Save all questions
    const savedQuestions = await Question.insertMany(
      validQuestions.filter((q) => q !== null)
    );

    res.json({
      success: true,
      message: `${savedQuestions.length} questions saved successfully`,
      savedCount: savedQuestions.length,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error("Error saving questions:", error);
    res.status(500).json({
      error: "Error saving questions",
      details: error.message,
    });
  }
};
