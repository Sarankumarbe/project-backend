const User = require('../models/User');

// GET all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// GET user by ID
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// UPDATE user
exports.updateUser = async (req, res) => {
  const { firstName, lastName, phoneNumber, profileImage, role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, {
    firstName, lastName, phoneNumber, profileImage, role
  }, { new: true }).select('-password');

  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// DELETE user
exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
};

exports.resetPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // From auth middleware
  
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
  
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });
  
    user.password = newPassword;
    await user.save();
  
    res.json({ message: 'Password updated successfully' });
  };
exports.toggleStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.status = user.status === 'active' ? 'inactive' : 'active';
  await user.save();

  res.json({ message: `User status updated to ${user.status}` });
};
  