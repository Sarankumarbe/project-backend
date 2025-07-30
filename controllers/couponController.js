const Coupon = require("../models/Coupon");

// Create
exports.createCoupon = async (req, res) => {
  try {
    const { title, code, type, amount, minAmount, status, expiryDate } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({
      title,
      code: code.toUpperCase(),
      type,
      amount,
      minAmount,
      status,
      expiryDate,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Get all coupons error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get by code (for billing)
exports.getCouponByCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const coupon = await Coupon.findOne({ code });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (coupon.status !== "active") return res.status(400).json({ message: "Coupon is inactive" });

    const now = new Date();
    if (new Date(coupon.expiryDate) < now)
      return res.status(400).json({ message: "Coupon has expired" });

    res.json(coupon);
  } catch (error) {
    console.error("Get coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Coupon not found" });

    res.json(updated);
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Coupon not found" });

    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
