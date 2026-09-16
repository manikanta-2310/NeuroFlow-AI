const jwt = require('jsonwebtoken');
const config = require('../config/env');
const repository = require('../config/repository');
const { httpError } = require('../utils/errors');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw httpError(401, 'Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw httpError(401, 'Invalid or expired authentication token');
    }

    const user = await repository.getById('users', decoded.userId || decoded.id);
    if (!user) {
      throw httpError(401, 'User account associated with this token not found');
    }

    req.user = {
      id: String(user.id || user._id),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
