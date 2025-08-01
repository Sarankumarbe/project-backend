const Course = require("../models/course");
const QuestionPaper = require("../models/questionPaper");
const Purchase = require("../models/Purchase");
const mongoose = require("mongoose");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, questionPapers, isCommon = false, coursePack, } = req.body;

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
      isCommon,
      coursePack,
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
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      title: { $regex: search, $options: "i" },
    };

    const skip = (page - 1) * limit;
    const total = await Course.countDocuments(query);

    const courses = await Course.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("questionPapers", "title duration")
      .sort({ createdAt: -1 });

    res.json({
      currentPage: parseInt(page),
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
    const {
      title,
      description,
      price,
      questionPapers,
      existingImage,
      is_active,
      isCommon,
      coursePack,
    } = req.body;
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
        is_active:
          is_active !== undefined ? is_active : existingCourse.is_active,
        isCommon:
          isCommon !== undefined ? isCommon : existingCourse.isCommon,
        coursePack: coursePack || existingCourse.coursePack,
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
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid User ID format",
      });
    }

    const purchases = await Purchase.find({
      userId: userId,
      isPaid: true,
    }).populate({
      path: "courseId",

      select: "title description image price questionPapers", // Only select needed fields
    });

    // Filter out purchases where course was not populated (either deleted or inactive)
    const validPurchases = purchases.filter((purchase) => purchase.courseId);

    // Transform the data for response
    const courses = validPurchases.map((purchase) => ({
      ...purchase.courseId.toObject(), // Convert Mongoose document to plain object
      purchaseDate: purchase.paidAt || purchase.createdAt, // Use paidAt if available
      orderId: purchase.razorpayOrderId, // Include order reference
    }));

    res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("[ERROR] in getUserCourses:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching purchased courses",
    });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { userId } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
    }

    // Check if user purchased this course
    const purchase = await Purchase.findOne({
      userId,
      courseId,
      isPaid: true,
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        error: "You haven't purchased this course",
      });
    }

    // Get course details with question papers
    const course = await Course.findOne({
      _id: courseId,
      is_active: true,
    }).populate("questionPapers");

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        purchaseDate: purchase.paidAt || purchase.createdAt,
        orderId: purchase.razorpayOrderId,
      },
    });
  } catch (error) {
    console.error("[ERROR] in getCourseDetails:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching course details",
    });
  }
};
