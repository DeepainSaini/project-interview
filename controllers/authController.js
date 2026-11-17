const bcrypt = require('bcrypt');
const path = require('path');
const { User } = require('../models');


const showHome = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '..', 'views', 'auth.html'));
};

const register = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: 'Name, email, and password are required.',
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    !cleanName ||
    cleanName.length > 255 ||
    !cleanEmail ||
    cleanEmail.length > 255
  ) {
    return res.status(400).json({
      message: 'Provide a valid name and email within 255 characters.',
    });
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and at most 72 bytes.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
    });

    return res.status(201).json({
      message: 'Account created.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Email is already registered.',
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Check the name and email you provided.',
      });
    }

    console.error('Registration failed:', error.name);
    return res.status(500).json({
      message: 'Unable to create account.',
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      message: 'Email and password are required.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (
    !cleanEmail ||
    cleanEmail.length > 255 ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(401).json({
      message: 'Invalid email or password.',
    });
  }

  try {
    const user = await User.findOne({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({ message: 'Login failed.' });
      }

      req.session.userId = user.id;

      req.session.save((error) => {
        if (error) {
          return res.status(500).json({ message: 'Login failed.' });
        }

        return res.status(200).json({
          message: 'Logged in successfully.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error('Login failed:', error.name);
    return res.status(500).json({ message: 'Login failed.' });
  }
};

const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: 'Logout failed.',
      });
    }

    res.clearCookie('project_interview.sid', { path: '/' });

    return res.json({
      message: 'Logged out successfully.',
    });
  });
};

module.exports = { register,login,showHome,logout };