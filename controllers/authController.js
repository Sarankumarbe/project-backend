const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // only HTTPS in prod
  sameSite: "Lax", // or 'Strict' for tighter control
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    // Check if user exists by email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or phone number already exists" });
    }

    const userRole = role === "admin" ? "admin" : "user";

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: userRole,
    });
    await user.save();

    const token = generateToken(user);
    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
      });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    if (req.baseUrl.includes("/admin") && user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can login from this page" });
    }

    if (req.baseUrl.includes("/user") && user.role !== "user") {
      return res
        .status(403)
        .json({ message: "Only users can login from this page" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User account is inactive" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user);

    res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
