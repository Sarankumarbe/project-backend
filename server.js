require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoute');

const app = express();

// app.use(cors({
//   origin: process.env.CLIENT_URL,
//   credentials: true
// }));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic test route, should not be protected
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
