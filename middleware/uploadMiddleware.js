// middlewares/uploadMiddleware.js
const multer = require("multer");
const questionPaperHelper = require("../helper/questionPaperHelper");

const fileFilter = (req, file, cb) => {
  if (questionPaperHelper.supportedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, Word, and text files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

const handleUpload = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: "File upload error",
          details: err.message,
        });
      }
      next();
    });
  };
};

module.exports = {
  handleUpload,
};
