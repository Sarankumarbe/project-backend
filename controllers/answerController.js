// controllers/answerController.js
const QuestionPaper = require("../models/questionPaper");
const UserSubmission = require("../models/userQuestionSubmission");

exports.submitAnswers = async (req, res) => {
  const userId = req.user.id;
  const { questionPaperId, answers } = req.body;

  try {
    // Check if already submitted
    const existing = await UserSubmission.findOne({
      user: userId,
      questionPaper: questionPaperId,
      isSubmitted: true,
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Already submitted this question paper." });

    const paper = await QuestionPaper.findById(questionPaperId);
    if (!paper)
      return res.status(404).json({ message: "Question paper not found." });

    let totalMarks = 0;
    const processedAnswers = [];

    for (const submitted of answers) {
      const question = paper.questions.find(
        (q) => q.questionNumber === submitted.questionNumber
      );
      if (!question) continue;

      const isCorrect = submitted.selectedAnswer === question.correctAnswer;
      const marksAwarded = isCorrect ? question.marks : -question.negativeMarks;

      totalMarks += marksAwarded;

      processedAnswers.push({
        questionNumber: submitted.questionNumber,
        selectedAnswer: submitted.selectedAnswer,
        isCorrect,
        marksAwarded,
      });
    }

    const submission = new UserSubmission({
      user: userId,
      questionPaper: questionPaperId,
      answers: processedAnswers,
      totalMarks,
      isSubmitted: true,
      submittedAt: new Date(),
    });

    await submission.save();
    res
      .status(200)
      .json({
        message: "Submission successful",
        totalMarks,
        answers: processedAnswers,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during submission" });
  }
};
exports.getSubmission = async (req, res) => {
  const userId = req.user.id;
  const { questionPaperId } = req.params;

  try {
    const submission = await UserSubmission.findOne({
      user: userId,
      questionPaper: questionPaperId,
      isSubmitted: true,
    });

    if (!submission)
      return res.status(404).json({ message: "No submission found" });

    res.status(200).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving submission" });
  }
};
