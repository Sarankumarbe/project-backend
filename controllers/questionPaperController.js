// controllers/questionPaperController.js
const questionPaperHelper = require("../helper/questionPaperHelper");
const QuestionPaper = require("../models/questionPaper");

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
    const { title, duration, questions } = req.body;

    // Validate required fields
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: "Missing required fields: questions array is required",
      });
    }

    // Validate each question
    const validationErrors = [];
    const validQuestions = questions
      .map((q, index) => {
        // Basic validation
        if (!q.questionText) {
          validationErrors.push(
            `Question ${index + 1} is missing question text`
          );
          return null;
        }

        if (
          !q.correctAnswer ||
          !["A", "B", "C", "D", "E"].includes(q.correctAnswer)
        ) {
          validationErrors.push(
            `Question ${index + 1} has invalid or missing correct answer`
          );
          return null;
        }

        // Process options
        const validOptions = {};
        ["A", "B", "C", "D", "E"].forEach((opt) => {
          validOptions[opt] = {
            text: q.options?.[opt]?.text || "",
            image: q.options?.[opt]?.image || null,
          };

          // Option validation
          if (!validOptions[opt].text) {
            validationErrors.push(
              `Question ${index + 1} option ${opt} is empty`
            );
          }
        });

        return {
          questionNumber: q.questionNumber || `Q${index + 1}`,
          questionText: q.questionText,
          questionImage: q.questionImage || null,
          options: validOptions,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty || "Medium",
          explanation: q.explanation || "",
          marks: Number(q.marks) || 1,
          negativeMarks: Number(q.negativeMarks) || 0.25,
          hasImages: Boolean(
            q.questionImage ||
              Object.values(q.options || {}).some((opt) => opt?.image)
          ),
        };
      })
      .filter((q) => q !== null);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation errors",
        details: validationErrors,
      });
    }

    // Create the question paper
    const questionPaper = new QuestionPaper({
      title:
        title || `Question Paper ${new Date().toISOString().split("T")[0]}`,
      duration: Number(duration) || 60,
      questions: validQuestions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedPaper = await questionPaper.save();

    res.status(201).json({
      success: true,
      message: `Question paper "${savedPaper.title}" saved successfully with ${savedPaper.questions.length} questions`,
      questionPaper: savedPaper,
    });
  } catch (error) {
    console.error("Error saving questions:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.getQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const questionPaper = await QuestionPaper.findById(id);

    if (!questionPaper) {
      return res.status(404).json({ message: "Question paper not found" });
    }

    res.status(200).json(questionPaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllQuestionPapers = async (req, res) => {
  try {
    const questionPapers = await QuestionPaper.find().sort({ createdAt: -1 });
    res.status(200).json(questionPapers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, questions } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (duration) updateData.duration = duration;
    if (questions) updateData.questions = questions;

    const updatedPaper = await QuestionPaper.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPaper) {
      return res.status(404).json({ message: "Question paper not found" });
    }

    res.status(200).json(updatedPaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPaper = await QuestionPaper.findByIdAndDelete(id);

    if (!deletedPaper) {
      return res.status(404).json({ message: "Question paper not found" });
    }

    res.status(200).json({
      message: "Question paper deleted successfully",
      deletedPaper,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
