// Protected /me endpoint
const { verifyJWT } = require('../utils/auth');
const UserModel = require('../models/user');

async function meRouter(req, res) {
  if (req.url === '/me' && req.method === 'GET') {
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload) {
      res.writeHead(401); res.end('Invalid or expired token'); return true;
    }
    const user = await UserModel.findById(payload.id);
    if (!user) {
      res.writeHead(404); res.end('User not found'); return true;
    }
    // Hide password hash
    delete user.password;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
    return true;
  }
  return false;
}

module.exports = meRouter;
