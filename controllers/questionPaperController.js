// controllers/questionPaperController.js
const questionPaperHelper = require("../helper/questionPaperHelper");
const QuestionPaper = require("../models/questionPaper");
const fs = require("fs");
const path = require("path");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");

exports.uploadAndParseQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // If using disk storage, read the file
    const filePath = path.join(
      __dirname,
      "../uploads/question-papers/",
      req.file.filename
    );
    const fileBuffer = await fs.promises.readFile(filePath);

    const questions = await questionPaperHelper.processQuestionPaper(
      fileBuffer,
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
    const page = parseInt(req.query.page) || 1;  // Default page 1
    const limit = parseInt(req.query.limit) || 5; // Default limit 5
    const skip = (page - 1) * limit;

    const questionPaper = await QuestionPaper.findById(id).lean(); // Use lean for performance

    if (!questionPaper) {
      return res.status(404).json({ message: "Question paper not found" });
    }

    const totalQuestions = questionPaper.questions.length;
    const totalPages = Math.ceil(totalQuestions / limit);

    // Paginate the questions array
    const paginatedQuestions = questionPaper.questions.slice(skip, skip + limit);

    res.status(200).json({
      _id: questionPaper._id,
      title: questionPaper.title,
      duration: questionPaper.duration,
      questions: paginatedQuestions,
      page,
      limit,
      totalQuestions,
      totalPages,
      createdAt: questionPaper.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getAllQuestionPapers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      title: { $regex: search, $options: "i" },
    };

    const skip = (page - 1) * limit;
    const total = await QuestionPaper.countDocuments(query);

    const questionPapers = await QuestionPaper.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalQuestionPapers: total,
      questionPapers,
    });
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

exports.getQuestionPaperforPurchasedUser = async (req, res) => {
  try {
    const { questionPaperId } = req.params;
    const { userId } = req.body;

    console.log("Received IDs:", { questionPaperId, userId }); // Add this for debugging

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(questionPaperId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
    }

    // Check if user has access to this question paper
    const purchase = await Purchase.findOne({
      userId,
      courseId: { $exists: true }, // Ensure they've purchased a course
      isPaid: true,
    }).populate({
      path: "courseId",
      match: {
        questionPapers: questionPaperId,
        is_active: true,
      },
    });

    if (!purchase || !purchase.courseId) {
      return res.status(403).json({
        success: false,
        error: "You don't have access to this question paper",
      });
    }

    // Get question paper with questions
    const questionPaper = await QuestionPaper.findById(questionPaperId)
      .select("title duration questions createdAt")
      .lean();

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        error: "Question paper not found",
      });
    }

    // Format the response
    const formattedQuestions = questionPaper.questions.map((q) => ({
      id: q._id,
      text: q.questionText,
      questionNumber: q.questionNumber,
      options: Object.entries(q.options).map(([key, value]) => ({
        id: key,
        text: value.text,
      })),
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      difficulty: q.difficulty,
    }));

    res.json({
      success: true,
      questionPaper: {
        ...questionPaper,
        questions: formattedQuestions,
        totalMarks: questionPaper.questions.reduce(
          (sum, q) => sum + q.marks,
          0
        ),
      },
    });
  } catch (error) {
    console.error("[ERROR] in getQuestionPaper:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching question paper",
    });
  }
};
