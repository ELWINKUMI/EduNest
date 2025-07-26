// Example admin-only route
const { requireRole } = require('../utils/role');
const adminCheck = requireRole(['admin', 'super_admin']);

async function adminOnlyRouter(req, res) {
  if (req.url === '/admin-only' && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome, admin or super admin!', user: req.user }));
    return true;
  }
  return false;
}

module.exports = adminOnlyRouter;
