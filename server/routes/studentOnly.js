// Student only route
const { requireRole } = require('../utils/role');
const studentCheck = requireRole(['student']);

async function studentOnlyRouter(req, res) {
  if (req.url === '/student-only' && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome, student!', user: req.user }));
    return true;
  }
  return false;
}

module.exports = studentOnlyRouter;
