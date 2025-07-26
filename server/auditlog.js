// server/auditlog.js
// Helper to record audit log entries
const { getDb } = require('./utils/mongo');

async function recordAuditLog({ userId, userName, action, details }) {
  try {
    const db = await getDb();
    await db.collection('audit_log').insertOne({
      userId,
      userName,
      action,
      details,
      timestamp: new Date()
    });
  } catch (e) {
    // Fail silently
  }
}

module.exports = { recordAuditLog };
