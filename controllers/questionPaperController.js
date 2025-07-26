// controllers/questionPaperController.js
const questionPaperHelper = require("../helper/questionPaperHelper");

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
    const { courseId, questions } = req.body;

    if (!courseId || !questions) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Here you would typically save to database
    // For now, we'll just return the processed data
    res.json({
      success: true,
      message: "Questions saved successfully",
      questions: questions.map((q) => ({
        ...q,
        status: "saved",
      })),
    });
  } catch (error) {
    console.error("Error saving questions:", error);
    res.status(500).json({
      error: "Error saving questions",
      details: error.message,
    });
  }
};
