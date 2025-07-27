const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// 🔹 Get all cart items for a user
exports.getCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate('items.courseId');
    res.status(200).json(cart?.items || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
};

// 🔹 Add a course to the user's cart (no duplicates)
exports.addToCart = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid userId or courseId' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // 🔸 First-time cart creation
      cart = new Cart({ userId, items: [{ courseId }] });
    } else {
      const alreadyInCart = cart.items.some(item => item.courseId.toString() === courseId);
      if (alreadyInCart) {
        return res.status(400).json({ message: 'Course already in cart' });
      }

      cart.items.push({ courseId });
    }

    await cart.save();
    res.status(200).json({ message: 'Course added to cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};

// 🔹 Remove a course from the user's cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const beforeLength = cart.items.length;
    cart.items = cart.items.filter(item => item.courseId.toString() !== courseId);

    if (cart.items.length === beforeLength) {
      return res.status(404).json({ message: 'Course not found in cart' });
    }

    await cart.save();
    res.status(200).json({ message: 'Course removed from cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Error removing from cart', error: err.message });
  }
};
