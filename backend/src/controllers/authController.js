const jwt = require('jsonwebtoken');
const { passport } = require('../middleware/auth');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function login(req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid username or password',
      });
    }
    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        },
      },
    });
  })(req, res, next);
}

async function register(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }
    const user = await User.create({ username, password, role: 'user' });
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user',
    });
  }
}

module.exports = {
  login,
  register,
  me,
};
