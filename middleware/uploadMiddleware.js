const fs = require("fs");
const multer = require("multer");
const questionPaperHelper = require("../helper/questionPaperHelper");
const path = require("path");

const createUploadDirectories = () => {
  const directories = [
    path.join(__dirname, "../uploads/course-images"),
    path.join(__dirname, "../uploads/question-papers"),
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call this function immediately
createUploadDirectories();

const supportedQuestionPaperFormats = questionPaperHelper.supportedFormats || [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const supportedImageFormats = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// File filter for question papers
const questionPaperFilter = (req, file, cb) => {
  if (supportedQuestionPaperFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type for question paper. Only PDF, Word, and text files are allowed."
      ),
      false
    );
  }
};

// File filter for images
const imageFilter = (req, file, cb) => {
  if (supportedImageFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid image type. Only JPEG, PNG, GIF, and WEBP are allowed."
      ),
      false
    );
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    if (supportedImageFormats.includes(file.mimetype)) {
      cb(null, "uploads/course-images/");
    } else {
      cb(null, "uploads/question-papers/");
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext =
      path.extname(file.originalname) ||
      (file.mimetype === "image/jpeg"
        ? ".jpg"
        : file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/gif"
        ? ".gif"
        : file.mimetype === "image/webp"
        ? ".webp"
        : "");
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Upload configurations
const questionPaperUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: questionPaperFilter,
});

const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFilter,
});

// Middleware handlers
const handleQuestionPaperUpload = (fieldName) => {
  return (req, res, next) => {
    questionPaperUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: "Question paper upload failed",
          message: err.message,
        });
      }
      next();
    });
  };
};

const handleImageUpload = (fieldName) => {
  return (req, res, next) => {
    imageUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: "Image upload failed",
          message: err.message,
        });
      }
      next();
    });
  };
};

// Combined middleware that can handle both types
const handleUpload = (fieldName, type = "questionPaper") => {
  return type === "image"
    ? handleImageUpload(fieldName)
    : handleQuestionPaperUpload(fieldName);
};

module.exports = {
  handleUpload,
  handleQuestionPaperUpload,
  handleImageUpload,
};
