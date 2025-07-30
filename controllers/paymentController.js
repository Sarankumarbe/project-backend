const Razorpay = require("razorpay");
const crypto = require("crypto");
const Purchase = require("../models/Purchase");
const Course = require("../models/course");
const Cart = require("../models/Cart");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { userId, courses, amount } = req.body;

  try {
    // Validate courses exist
    const foundCourses = await Course.find({ _id: { $in: courses } });
    if (foundCourses.length !== courses.length) {
      return res.status(404).json({ message: "One or more courses not found" });
    }

    // Calculate total amount from server side for security
    const calculatedAmount = foundCourses.reduce(
      (sum, course) => sum + course.price,
      0
    );

    // Verify client-side calculated amount matches server-side calculation
    if (calculatedAmount !== amount) {
      return res.status(400).json({ message: "Amount validation failed" });
    }

    // Generate a shorter receipt ID
    const receiptId = `rcpt_${Date.now()}`.slice(0, 40); // Ensures it's <= 40 chars

    const options = {
      amount: calculatedAmount * 100, // Convert to paise
      currency: "INR",
      receipt: receiptId,
    };

    const order = await instance.orders.create(options);

    // Save pending purchase for each course
    const purchases = courses.map(
      (courseId) =>
        new Purchase({
          userId,
          courseId,
          razorpayOrderId: order.id,
          status: "pending",
        })
    );

    await Purchase.insertMany(purchases);

    res.json({
      success: true,
      order: {
        _id: order.id, // For reference in verification
        id: order.id, // For Razorpay client-side
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: err.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId } =
    req.body;

  try {
    // Verify the payment signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Update purchases with payment details and mark as paid
    const updateResult = await Purchase.updateMany(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          isPaid: true, // This is the critical change
          paidAt: new Date(), // Set the payment timestamp
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No purchases found for this order",
      });
    }

    // Get the purchased course IDs
    const purchases = await Purchase.find({
      razorpayOrderId: razorpay_order_id,
    });
    const courseIds = purchases.map((p) => p.courseId);

    // Remove purchased courses from user's cart
    if (userId) {
      await Cart.deleteMany({
        userId: userId,
        courseId: { $in: courseIds },
      });
    }

    res.json({
      success: true,
      message: "Payment verified and courses purchased successfully",
      courseIds,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build search query
    let searchQuery = {};

    // If search term is provided, search in user email/name and course title
    if (search) {
      searchQuery.$or = [
        { "user.email": { $regex: search, $options: "i" } },
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
        { "course.title": { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by payment status
    if (status) {
      if (status === "paid") {
        searchQuery.isPaid = true;
      } else if (status === "pending") {
        searchQuery.isPaid = false;
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get payments with populated user and course data
    const payments = await Purchase.find(searchQuery)
      .populate({
        path: "userId",
        select: "firstName lastName email phone",
        model: "User",
      })
      .populate({
        path: "courseId",
        select: "title price thumbnail",
        model: "Course",
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber);

    // Get total count for pagination
    const totalPayments = await Purchase.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalPayments / limitNumber);

    // Calculate pagination info
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Format the response data
    const formattedPayments = payments.map((payment) => ({
      _id: payment._id,
      user: payment.userId
        ? {
            firstName: payment.userId.firstName,
            lastName: payment.userId.lastName,

            email: payment.userId.email,
            phone: payment.userId.phone,
          }
        : null,
      course: payment.courseId
        ? {
            title: payment.courseId.title,
            price: payment.courseId.price,
            thumbnail: payment.courseId.thumbnail,
          }
        : null,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
      isPaid: payment.isPaid,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalPayments,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Purchase.countDocuments();
    const paidPayments = await Purchase.countDocuments({ isPaid: true });
    const pendingPayments = await Purchase.countDocuments({ isPaid: false });

    // Calculate total revenue
    const revenueData = await Purchase.aggregate([
      { $match: { isPaid: true } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$course.price" },
        },
      },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        paidPayments,
        pendingPayments,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment statistics",
      error: error.message,
    });
  }
};
