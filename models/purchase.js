const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
