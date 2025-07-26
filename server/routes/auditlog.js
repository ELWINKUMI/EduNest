// Endpoint for super admin to fetch audit logs

const { getDb } = require('../utils/mongo');
// The auth logic is usually in utils/auth.js in your project.
// Make sure this file exists and exports verifyJWT or verifyToken.
const { verifyJWT } = require('../utils/auth');

module.exports = async function(req, res) {
  if (req.method === 'GET') {
    // Only school admin can view audit log
    // Try to extract/verify JWT from Authorization header
    let user = null;
    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      user = token ? verifyJWT(token) : null;
    } catch (e) {
      user = null;
    }
    if (!user || user.role !== 'school_admin') {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const db = await getDb();
    const logs = await db.collection('audit_log').find({}).sort({ timestamp: -1 }).limit(100).toArray();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(logs));
    return;
  }
  res.writeHead(405);
  res.end('Method Not Allowed');
};