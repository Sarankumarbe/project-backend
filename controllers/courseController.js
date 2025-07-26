const Course = require("../models/course");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    const savedCourse = await course.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
      const course = await Course.findById(req.params.id).populate("questionPapers", "title duration");
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCourse) return res.status(404).json({ error: "Course not found" });
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
