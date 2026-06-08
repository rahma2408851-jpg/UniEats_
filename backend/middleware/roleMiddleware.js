/**
 * roleMiddleware.js
 * Role-based access control (RBAC) helpers.
 *
 * Supported roles: admin | owner | student
 *
 * Must be used AFTER the `authenticate` middleware so that req.user is available.
 *
 * Usage examples:
 *   router.delete('/users/:id',   authenticate, requireRole('admin'), handler);
 *   router.put('/restaurants/:id', authenticate, requireRole('admin', 'owner'), handler);
 */

/**
 * Factory that returns a middleware allowing only the listed roles.
 * @param {...string} allowedRoles - One or more role strings
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

/**
 * Convenience: admin only.
 */
const requireAdmin = requireRole('admin');

/**
 * Convenience: admin or owner.
 */
const requireOwnerOrAdmin = requireRole('admin', 'owner');

module.exports = { requireRole, requireAdmin, requireOwnerOrAdmin };
