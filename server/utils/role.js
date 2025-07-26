// Role-based access middleware
const { verifyJWT } = require('./auth');

function requireRole(roles) {
  return async function (req, res) {
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload) {
      res.writeHead(401); res.end('Invalid or expired token'); return true;
    }
    if (!roles.includes(payload.role)) {
      res.writeHead(403); res.end('Forbidden: insufficient role'); return true;
    }
    req.user = payload;
    return false; // Continue to route handler
  };
}

module.exports = { requireRole };
