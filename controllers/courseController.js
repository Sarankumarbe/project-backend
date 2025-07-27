const Course = require("../models/course");
const QuestionPaper = require("../models/questionPaper");
const Purchase = require("../models/Purchase");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, questionPapers } = req.body;

    const image = req.file ? req.file.path : null;

    let questionPapersArray = [];
    if (questionPapers) {
      try {
        questionPapersArray = JSON.parse(questionPapers);
      } catch (e) {
        questionPapersArray = Array.isArray(questionPapers)
          ? questionPapers
          : [questionPapers];
      }
    }

    // Validate question papers exist
    const validQuestionPapers = await QuestionPaper.find({
      _id: { $in: questionPapersArray },
    });

    if (validQuestionPapers.length !== questionPapersArray.length) {
      return res.status(400).json({
        success: false,
        message: "One or more question papers not found",
      });
    }

    const course = new Course({
      title,
      description,
      price,
      questionPapers: questionPapersArray,
      image,
    });

    const savedCourse = await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: savedCourse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create course",
    });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    // Extract page and limit from query params, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate how many documents to skip
    const skip = (page - 1) * limit;

    // Get total number of courses
    const total = await Course.countDocuments();

    // Fetch paginated results
    const courses = await Course.find()
      .skip(skip)
      .limit(limit)
      .populate("questionPapers", "title duration")
      .sort({ createdAt: -1 }); // Optional: newest first

    res.json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCourses: total,
      courses,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "questionPapers",
      "title duration"
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, price, questionPapers, existingImage, is_active } =
      req.body;
    const courseId = req.params.id;

    // Find the existing course
    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Handle image - use new file if exists, otherwise keep existing or use existingImage from form
    let image = existingCourse.image;
    if (req.file) {
      image = req.file.path;
    } else if (existingImage === "") {
      // If existingImage is empty string, it means remove the image
      image = null;
    } else if (existingImage) {
      // Use the existingImage URL from the form
      image = existingImage;
    }

    // Parse questionPapers if it's a string (from FormData)
    let questionPapersArray = [];
    if (questionPapers) {
      try {
        questionPapersArray = JSON.parse(questionPapers);
      } catch (e) {
        questionPapersArray = Array.isArray(questionPapers)
          ? questionPapers
          : [questionPapers];
      }
    }

    // Validate question papers exist
    const validQuestionPapers = await QuestionPaper.find({
      _id: { $in: questionPapersArray },
    });

    if (validQuestionPapers.length !== questionPapersArray.length) {
      return res.status(400).json({
        success: false,
        message: "One or more question papers not found",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title,
        description,
        price,
        questionPapers: questionPapersArray,
        image,
        is_active: is_active !== undefined ? is_active : existingCourse.is_active,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update course",
    });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse)
      return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getUserCourses = async (req, res) => {
  const purchases = await Purchase.find({ userId: req.user._id, isPaid: true })
                                  .populate("courseId");
  const courses = purchases.map(p => p.courseId);
  res.json({ courses });
};
