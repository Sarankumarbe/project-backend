const Razorpay = require("razorpay");
const crypto = require("crypto");
const Purchase = require("../models/Purchase");
const Course = require("../models/course");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const options = {
    amount: course.price * 100, // Razorpay accepts paise
    currency: "INR",
    receipt: `rcpt_${courseId}_${Date.now()}`,
  };

  try {
    const order = await instance.orders.create(options);

    // Save pending purchase
    const purchase = new Purchase({
      userId: req.user._id,
      courseId,
      razorpayOrderId: order.id,
    });
    await purchase.save();

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};
exports.verifyPayment = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
                                    .update(body)
                                    .digest("hex");
  
    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid signature" });
    }
  
    const purchase = await Purchase.findOne({ razorpayOrderId });
    if (!purchase) return res.status(404).json({ message: "Order not found" });
  
    purchase.razorpayPaymentId = razorpayPaymentId;
    purchase.razorpaySignature = razorpaySignature;
    purchase.isPaid = true;
    purchase.paidAt = new Date();
    await purchase.save();
  
    res.json({ success: true, message: "Payment verified" });
  };
