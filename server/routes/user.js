// User management for school admins
const { requireRole } = require('../utils/role');
const UserModel = require('../models/user');
const { hashPassword } = require('../utils/auth');
const adminCheck = requireRole(['admin']);
const { recordAuditLog } = require('../auditlog');

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

async function userRouter(req, res) {
  // Edit teacher or student (school_admin or admin only)
  if (req.url.startsWith('/users/') && req.method === 'PUT') {
    const { requireRole } = require('../utils/role');
    const check = requireRole(['school_admin', 'admin']);
    if (await check(req, res)) return true;
    const userId = req.url.split('/')[2];
    if (!userId) { res.writeHead(400); res.end('Missing userId'); return true; }
    const body = await parseBody(req);
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    // Only allow editing teacher or student in the same school
    const user = await db.collection('users').findOne({ userId, schoolId: req.user.schoolId });
    if (!user || !['teacher', 'student'].includes(user.role)) {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const update = {};
    if (body.name) update.name = body.name;
    if (body.email) update.email = body.email;
    update.updatedAt = new Date();
    await db.collection('users').updateOne({ userId, schoolId: req.user.schoolId }, { $set: update });
    res.writeHead(200); res.end('User updated');
    return true;
  }
  // Delete teacher or student (school_admin or admin only)
  if (req.url.startsWith('/users/') && req.method === 'DELETE') {
    const { requireRole } = require('../utils/role');
    const check = requireRole(['school_admin', 'admin']);
    if (await check(req, res)) return true;
    const userId = req.url.split('/')[2];
    if (!userId) { res.writeHead(400); res.end('Missing userId'); return true; }
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    // Only allow deleting teacher or student in the same school
    const user = await db.collection('users').findOne({ userId, schoolId: req.user.schoolId });
    if (!user || !['teacher', 'student'].includes(user.role)) {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    await db.collection('users').deleteOne({ userId, schoolId: req.user.schoolId });
    res.writeHead(200); res.end('User deleted');
    return true;
  }
  // List all users in the system (super_admin only, for reports)
  if (req.url === '/users/all' && req.method === 'GET') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    const users = await db.collection('users').find({}).toArray();
    users.forEach(u => { delete u.password; });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
    return true;
  }
  // List all admins for a given school (super_admin only)
  if (req.url.startsWith('/admins?schoolId=') && req.method === 'GET') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const schoolId = req.url.split('=')[1];
    if (!schoolId) { res.writeHead(400); res.end('Missing schoolId'); return true; }
    const admins = await UserModel.findBySchool(schoolId);
    const adminList = admins.filter(u => u.role === 'admin').map(u => {
      const { password, ...rest } = u; return rest;
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(adminList));
    return true;
  }

  // Edit admin (super_admin only)
  if (req.url.startsWith('/admins/') && req.method === 'PUT') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const adminUserId = req.url.split('/')[2];
    const body = await parseBody(req);
    const update = {};
    if (body.name) update.name = body.name;
    if (body.email) update.email = body.email;
    await UserModel.updateByUserId(adminUserId, update);
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Edit Admin',
      details: `AdminUserId: ${adminUserId}, Update: ${JSON.stringify(update)}`
    });
    res.writeHead(200); res.end('Admin updated');
    return true;
  }

  // Delete admin (super_admin only)
  if (req.url.startsWith('/admins/') && req.method === 'DELETE') {
    const { verifyJWT } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const adminUserId = req.url.split('/')[2];
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    await db.collection('users').deleteOne({ userId: adminUserId, role: 'admin' });
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Delete Admin',
      details: `AdminUserId: ${adminUserId}`
    });
    res.writeHead(200); res.end('Admin deleted');
    return true;
  }

  // Reset admin password (super_admin only)
  if (req.url.startsWith('/admins/') && req.url.endsWith('/reset-password') && req.method === 'POST') {
    const { verifyJWT, hashPassword } = require('../utils/auth');
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401); res.end('Missing or invalid token'); return true;
    }
    const token = auth.slice(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'super_admin') {
      res.writeHead(403); res.end('Forbidden'); return true;
    }
    const adminUserId = req.url.split('/')[2];
    const newPassword = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(newPassword);
    await UserModel.updateByUserId(adminUserId, { password: hashed });
    await recordAuditLog({
      userId: payload.userId || 'super_admin',
      userName: payload.name || 'Super Admin',
      action: 'Reset Admin Password',
      details: `AdminUserId: ${adminUserId}`
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Password reset', newPassword }));
    return true;
  }
  // One-time fix: update all admin users to have userId field if missing
  if (req.url === '/fix-admin-userids' && req.method === 'POST') {
    const UserModel = require('../models/user');
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    const admins = await db.collection('users').find({ role: 'admin', $or: [ { userId: { $exists: false } }, { userId: null } ] }).toArray();
    let updated = 0;
    for (const admin of admins) {
      // Try to infer userId from schoolId and email if possible
      let userId = '';
      if (admin.schoolId && admin.email && admin.email.includes('@')) {
        userId = admin.email.split('@')[0].toUpperCase();
      } else if (admin.schoolId) {
        userId = `${admin.schoolId}-ADMIN`;
      } else {
        continue;
      }
      await db.collection('users').updateOne({ _id: admin._id }, { $set: { userId } });
      updated++;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Admin userIds updated', updated }));
    return true;
  }
  // Create teacher, student (admin only) or admin (super_admin only, with autoGenerate)
  if (req.url === '/users' && req.method === 'POST') {
    const body = await parseBody(req);
    // Super admin can create admin for any school with autoGenerate
    if (body.autoGenerate && body.role === 'admin') {
      // Only super_admin allowed
      const { verifyJWT } = require('../utils/auth');
      const auth = req.headers['authorization'] || req.headers['Authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        res.writeHead(401); res.end('Missing or invalid token'); return true;
      }
      const token = auth.slice(7);
      const payload = verifyJWT(token);
      if (!payload || payload.role !== 'super_admin') {
        res.writeHead(403); res.end('Forbidden'); return true;
      }
      if (!body.name || !body.schoolId) {
        res.writeHead(400); res.end('Missing fields'); return true;
      }
      // Generate unique admin ID for school
      const usersInSchool = await UserModel.findBySchool(body.schoolId);
      const count = usersInSchool.filter(u => u.role === 'admin').length + 1;
      const userId = `${body.schoolId}-ADMIN${count}`;
      const password = Math.random().toString(36).slice(-8);
      const email = `${userId.toLowerCase()}@edunest.com`;
      const hashed = await hashPassword(password);
      const user = {
        name: body.name,
        email,
        userId,
        password: hashed,
        role: 'admin',
        schoolId: body.schoolId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await UserModel.create(user);
      await recordAuditLog({
        userId: payload.userId || 'super_admin',
        userName: payload.name || 'Super Admin',
        action: 'Create Admin',
        details: `AdminUserId: ${userId}, SchoolId: ${body.schoolId}`
      });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Admin created',
        userId,
        password
      }));
      return true;
    }
    // Admin creates teacher or student
    if (await adminCheck(req, res)) return true;
    if (!body.name || !body.role) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    if (!['teacher', 'student'].includes(body.role)) {
      res.writeHead(400); res.end('Role must be teacher or student'); return true;
    }
    // Generate unique user ID per school and role
    const usersInSchool = await UserModel.findBySchool(req.user.schoolId);
    const rolePrefix = body.role === 'teacher' ? 'T' : 'S';
    const count = usersInSchool.filter(u => u.role === body.role).length + 1;
    const userId = `${req.user.schoolId}-${rolePrefix}${count.toString().padStart(3, '0')}`;
    // Generate password
    const password = Math.random().toString(36).slice(-8);
    // Email (optional, can be generated if not provided)
    const email = body.email || `${userId.toLowerCase()}@edunest.com`;
    const existing = await UserModel.findByEmail(email);
    if (existing) { res.writeHead(409); res.end('Email exists'); return true; }
    const hashed = await hashPassword(password);
    const user = {
      name: body.name,
      email,
      userId,
      password: hashed,
      role: body.role,
      schoolId: req.user.schoolId,
      assignedClass: body.assignedClass || null,
      subjects: body.subjects || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await UserModel.create(user);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'User created',
      userId,
      password,
      email
    }));
    return true;
  }
  // List all users in school (school_admin or admin)
  if (req.url === '/users' && req.method === 'GET') {
    const { requireRole } = require('../utils/role');
    const check = requireRole(['school_admin', 'admin']);
    if (await check(req, res)) return true;
    let users = await UserModel.findBySchool(req.user.schoolId);
    // Exclude admins for school admin dashboard
    users = users.filter(u => u.role !== 'admin');
    users.forEach(u => { delete u.password; });
    // Fetch school name
    const SchoolModel = require('../models/school');
    let schoolName = '';
    try {
      const school = await SchoolModel.findById(req.user.schoolId);
      schoolName = school ? school.name : '';
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users, schoolName }));
    return true;
  }
  return false;
}

module.exports = userRouter;
