// Announcement routes
const { requireRole } = require('../utils/role');
const { getDb } = require('../utils/mongo');
const UserModel = require('../models/user');
const teacherOrAdminCheck = requireRole(['teacher', 'admin']);
const studentCheck = requireRole(['student']);
const { recordAuditLog } = require('../auditlog');

const collection = () => getDb().collection('announcements');

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

async function announcementRouter(req, res) {
  // Teacher/Admin: create announcement
  if (req.url === '/announcements' && req.method === 'POST') {
    // Require super_admin role
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden: insufficient role'); return true;
    }
    const body = await parseBody(req);
    const { title, body: announcementBody, sendAt } = body;
    if (!title || !announcementBody || !sendAt) return res.writeHead(400).end('Title, body, and sendAt required');
    const sendDate = new Date(sendAt);
    if (isNaN(sendDate.getTime())) return res.writeHead(400).end('Invalid sendAt date');
    const announcement = {
      title,
      body: announcementBody,
      classLevel: body.classLevel || null,
      authorId: payload.userId || payload.id || null,
      sendAt: sendDate,
      createdAt: new Date()
    };
    await collection().insertOne(announcement);
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Create Announcement',
      details: `Title: ${title}`
    });
    res.writeHead(201).end('Announcement created');
  }
  // Super admin: delete announcement
  if (req.url.startsWith('/announcements/') && req.method === 'DELETE') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden: insufficient role'); return true;
    }
    const id = req.url.split('/')[2];
    const { ObjectId } = require('mongodb');
    const result = await collection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      res.writeHead(404); res.end('Announcement not found'); return true;
    }
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Delete Announcement',
      details: `AnnouncementId: ${id}`
    });
    res.writeHead(200); res.end('Announcement deleted');
    return true;
  }
  // Super admin: edit announcement
  if (req.url.startsWith('/announcements/') && req.method === 'PUT') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden: insufficient role'); return true;
    }
    const id = req.url.split('/')[2];
    const body = await parseBody(req);
    const update = {};
    if (body.title) update.title = body.title;
    if (body.body) update.body = body.body;
    if (body.sendAt) {
      const sendDate = new Date(body.sendAt);
      if (isNaN(sendDate.getTime())) {
        res.writeHead(400); res.end('Invalid sendAt date'); return true;
      }
      update.sendAt = sendDate;
    }
    const { ObjectId } = require('mongodb');
    const result = await collection().updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (result.matchedCount === 0) {
      res.writeHead(404); res.end('Announcement not found'); return true;
    }
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Edit Announcement',
      details: `AnnouncementId: ${id}, Update: ${JSON.stringify(update)}`
    });
    res.writeHead(200); res.end('Announcement updated');
    return true;
  }
  // Student: list announcements for their school/class
  if (req.url === '/announcements' && req.method === 'GET') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    // If super_admin, show all announcements they've created
    if (payload && payload.role === 'super_admin') {
      const announcements = await collection().find({ authorId: payload.userId || payload.id || null }).sort({ createdAt: -1 }).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(announcements));
      return true;
    }
    // Otherwise, show only sent announcements
    const now = new Date();
    const announcements = await collection().find({ sendAt: { $lte: now } }).sort({ sendAt: -1 }).toArray();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(announcements));
    return true;
  }
  return false;
}

module.exports = announcementRouter;
