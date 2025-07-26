// Super admin only route
const { requireRole } = require('../utils/role');
const superAdminCheck = requireRole(['super_admin']);

async function superAdminOnlyRouter(req, res) {
  if (req.url === '/super-admin-only' && req.method === 'GET') {
    if (await superAdminCheck(req, res)) return true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome, super admin!', user: req.user }));
    return true;
  }
  return false;
}

module.exports = superAdminOnlyRouter;
