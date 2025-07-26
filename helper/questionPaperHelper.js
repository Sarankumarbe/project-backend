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
    this.questionPattern = /^\s*(Q\d+|Question\s+\d+|\d+\.)\s*/i;
    this.optionPattern = /^\s*([A-E])[\)\.]\s*/i;
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
    const questionRegex = /Q\d+\.\s([\s\S]*?)(?=Q\d+\.|$)/g;
    let match;
    let index = 1;

    while ((match = questionRegex.exec(text)) !== null) {
      const block = match[1].trim();

      const questionTextMatch = block.match(/^(.*?)(?=\nA\)|\nA\.)/s);
      const questionText = questionTextMatch ? questionTextMatch[1].trim() : "";

      const options = {};
      ["A", "B", "C", "D", "E"].forEach((opt) => {
        const optMatch = block.match(
          new RegExp(`${opt}[\\)|\\.]\\s*(.*?)\\n`, "i")
        );
        if (optMatch) options[opt] = { text: optMatch[1].trim(), image: null };
      });

      const correctMatch = block.match(/Correct Answer:\s*([A-E])/i);
      const explanationMatch = block.match(/Explanation:\s*(.*)/is);
      const difficultyMatch = block.match(/Difficulty Level:\s*(\w+)/i);

      questions.push({
        questionNumber: `Q${index}`,
        questionText,
        questionImage: null,
        options,
        correctAnswer: correctMatch ? correctMatch[1].toUpperCase() : "",
        explanation: explanationMatch ? explanationMatch[1].trim() : "",
        difficulty: difficultyMatch
          ? this.capitalize(difficultyMatch[1])
          : "Easy",
        marks: 1,
        negativeMarks: 0.25,
        hasImages: false,
      });

      index++;
    }

    return questions;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  isQuestionLine(line) {
    return this.questionPattern.test(line);
  }

  isOptionLine(line) {
    return this.optionPattern.test(line);
  }

  isMetadataLine(line) {
    return (
      line.match(/Correct\s+Answer\s*:/i) ||
      line.match(/Difficulty\s*(Level)?\s*:/i) ||
      line.match(/Explanation\s*:/i) ||
      line.match(/Marks\s*:/i)
    );
  }

  createNewQuestion(line, index) {
    return {
      id: `q_${Date.now()}_${index}`,
      questionNumber: `Q${index}`,
      questionText: "",
      questionImage: null,
      options: {
        A: { text: "", image: null },
        B: { text: "", image: null },
        C: { text: "", image: null },
        D: { text: "", image: null },
        E: { text: "", image: null },
      },
      correctAnswer: "",
      difficulty: "Easy",
      explanation: "",
      marks: 1,
      negativeMarks: 0.25,
      hasImages: false,
      isEdited: false,
    };
  }

  processOptionLine(line, question) {
    const optionLetter = line.match(this.optionPattern)[1].toUpperCase();
    const optionText = line.replace(this.optionPattern, "").trim();
    question.options[optionLetter].text = optionText;
  }

  processMetadataLine(line, question) {
    // Correct answer
    const correctAnswerMatch = line.match(/Correct\s+Answer\s*:\s*([A-E])/i);
    if (correctAnswerMatch) {
      question.correctAnswer = correctAnswerMatch[1].toUpperCase();
    }

    // Difficulty
    const difficultyMatch = line.match(/Difficulty\s*(Level)?\s*:\s*(\w+)/i);
    if (difficultyMatch) {
      const difficulty = difficultyMatch[2] || difficultyMatch[1];
      question.difficulty =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    }

    // Explanation
    const explanationMatch = line.match(/Explanation\s*:\s*(.*)/i);
    if (explanationMatch) {
      question.explanation = explanationMatch[1].trim();
    }

    // Marks
    const marksMatch = line.match(/Marks\s*:\s*([\d\.]+)/i);
    if (marksMatch) {
      question.marks = parseFloat(marksMatch[1]);
    }
  }

  finalizeCurrentQuestion(question, content, state) {
    if (state === "QUESTION") {
      question.questionText = content.join("\n").trim();
    } else if (state === "OPTIONS") {
      this.finalizeLastOption(question, content);
    } else if (state === "METADATA") {
      // If we have content in metadata state, add to explanation
      if (content.length > 0) {
        question.explanation += "\n" + content.join("\n").trim();
      }
    }
  }

  finalizeLastOption(question, content) {
    // Find the last option that has text
    const options = Object.entries(question.options);
    for (let i = options.length - 1; i >= 0; i--) {
      const [key, value] = options[i];
      if (value.text.trim() !== "") {
        // Append any additional content to this option
        question.options[key].text += "\n" + content.join("\n").trim();
        return;
      }
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
