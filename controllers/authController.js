const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.signup = async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      console.log('Signup request body:', req.body);  // log incoming data
  
      const userRole = role === 'admin' ? 'admin' : 'user';
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email already registered:', email);
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      const user = new User({ firstName, lastName, email, password, role: userRole });
      await user.save();
  
      const token = generateToken(user);
      res.status(201).json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status
        },
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };  
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'User account is inactive' });
      }
  
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
  
      const token = generateToken(user);
  
      res.status(200).json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status
        },
        token
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  