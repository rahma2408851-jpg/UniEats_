/**
 * authMiddleware.js
 * Verifies the JWT present in the Authorization header.
 *.
 */

const jwt = require('jsonwebtoken');
const revokedTokens = new Set();

/**
 * Revoke a token (called by the logout controller).
 * @param {string} token - The raw JWT string
 */
function blockToken(token) {
  revokedTokens.add(token);
  // Prune expired tokens every time we add a new one
  pruneExpired();
}

/**
 * Remove tokens that are already expired — they can no longer be used anyway.
 */
function pruneExpired() {
  for (const token of revokedTokens) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      // Still valid → keep it
    } catch {
      // Expired or malformed → safe to drop
      revokedTokens.delete(token);
    }
  }
}


function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // FIX #5: reject revoked tokens
  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user  = decoded; // { id, name, email, role }
    req.token = token;   // expose for logout use
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authenticate, blockToken };
