// Teacher only route
const { requireRole } = require('../utils/role');
const teacherCheck = requireRole(['teacher']);

async function teacherOnlyRouter(req, res) {
  if (req.url === '/teacher-only' && req.method === 'GET') {
    if (await teacherCheck(req, res)) return true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome, teacher!', user: req.user }));
    return true;
  }
  return false;
}

module.exports = teacherOnlyRouter;
