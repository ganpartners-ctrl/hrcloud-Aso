// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/**
 * Sign a token for company login (employee or super-admin)
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

/**
 * Verify any JWT (company user or platform admin)
 */
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require platform admin role
 */
function requirePlatformAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }
    next();
  });
}

/**
 * Require company super-admin
 */
function requireSuperAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!['super_admin', 'platform_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}

/**
 * Ensure request belongs to the correct company
 */
function requireSameCompany(req, res, next) {
  verifyToken(req, res, () => {
    const coId = req.params.companyId || req.query.companyId || req.body.companyId;
    if (req.user.role === 'platform_admin') return next(); // platform admin sees all
    if (coId && req.user.companyId !== coId) {
      return res.status(403).json({ error: 'Access denied to this company' });
    }
    next();
  });
}

module.exports = { signToken, verifyToken, requirePlatformAdmin, requireSuperAdmin, requireSameCompany };
