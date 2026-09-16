const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const repository = require('../config/repository');
const { httpError } = require('../utils/errors');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id || user._id,
      email: user.email,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

const authController = {
  async register(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw httpError(400, 'Name, email, and password are required');
    }

    if (password.length < 6) {
      throw httpError(400, 'Password must be at least 6 characters long');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await repository.getOne('users', { email: normalizedEmail });
    if (existing) {
      throw httpError(409, 'An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await repository.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(user);
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  },

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw httpError(400, 'Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await repository.getOne('users', { email: normalizedEmail });

    if (!user) {
      throw httpError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw httpError(401, 'Invalid email or password');
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  },

  async me(req, res) {
    const user = await repository.getById('users', req.user.id);
    if (!user) {
      throw httpError(404, 'User account not found');
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  },
};

module.exports = authController;
