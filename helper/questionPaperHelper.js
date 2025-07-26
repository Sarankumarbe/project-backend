// helpers/questionPaperHelper.js
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const { promisify } = require("util");
const fs = require("fs");
const readFileAsync = promisify(fs.readFile);

class QuestionPaperHelper {
  constructor() {
    this.supportedFormats = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
  }

  async extractTextFromFile(fileBuffer, mimeType) {
    try {
      if (mimeType === "application/pdf") {
        const data = await pdf(fileBuffer);
        return data.text;
      } else if (
        mimeType.includes("msword") ||
        mimeType.includes("wordprocessingml")
      ) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value;
      } else if (mimeType === "text/plain") {
        return fileBuffer.toString("utf-8");
      }
      throw new Error("Unsupported file format");
    } catch (error) {
      console.error("Error extracting text:", error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  parseQuestions(text) {
    const questions = [];
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    let currentQuestion = null;

    for (const line of lines) {
      // Question detection
      if (this.isQuestionLine(line)) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = this.createNewQuestion(line, questions.length + 1);
      }
      // Option detection
      else if (currentQuestion && this.isOptionLine(line)) {
        const { optionLetter, optionText } = this.parseOptionLine(line);
        currentQuestion.options[optionLetter] = {
          text: optionText,
          image: null,
        };
      }
      // Metadata detection
      else if (currentQuestion) {
        this.parseQuestionMetadata(line, currentQuestion);
      }
    }

    if (currentQuestion) questions.push(currentQuestion);
    return questions;
  }

  isQuestionLine(line) {
    return line.match(/^\s*(Q\d+|Question\s+\d+|\d+\.)\s*/i);
  }

  isOptionLine(line) {
    return line.match(/^\s*[A-E][\)\.]\s*/i);
  }

  createNewQuestion(line, index) {
    return {
      id: `q_${Date.now()}_${index}`,
      questionNumber: `Q${index}`,
      questionText: line
        .replace(/^\s*(Q\d+|Question\s+\d+|\d+\.)\s*/i, "")
        .trim(),
      questionImage: null,
      options: {},
      correctAnswer: "",
      difficulty: "Easy",
      explanation: "",
      marks: 1,
      negativeMarks: 0.25,
      hasImages: false,
      isEdited: false,
    };
  }

  parseOptionLine(line) {
    const optionLetter = line.match(/^\s*([A-E])[\)\.]\s*/i)[1].toUpperCase();
    const optionText = line.replace(/^\s*[A-E][\)\.]\s*/i, "").trim();
    return { optionLetter, optionText };
  }

  parseQuestionMetadata(line, question) {
    // Correct answer
    const correctAnswerMatch = line.match(/Correct\s+Answer\s*:\s*([A-E])/i);
    if (correctAnswerMatch) {
      question.correctAnswer = correctAnswerMatch[1].toUpperCase();
    }

    // Difficulty
    const difficultyMatch = line.match(/Difficulty\s*:\s*(\w+)/i);
    if (difficultyMatch) {
      const difficulty = difficultyMatch[1];
      question.difficulty =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    }

    // Explanation
    const explanationMatch = line.match(/Explanation\s*:/i);
    if (explanationMatch) {
      question.explanation = line.replace(/Explanation\s*:\s*/i, "").trim();
    }
  }

  async processQuestionPaper(fileBuffer, originalname, mimeType) {
    try {
      if (!this.supportedFormats.includes(mimeType)) {
        throw new Error("Unsupported file format");
      }

      const text = await this.extractTextFromFile(fileBuffer, mimeType);
      const questions = this.parseQuestions(text);

      if (questions.length === 0) {
        throw new Error("No questions found in the document");
      }

      return questions;
    } catch (error) {
      console.error("Error processing question paper:", error);
      throw error;
    }
  }
}

module.exports = new QuestionPaperHelper();
