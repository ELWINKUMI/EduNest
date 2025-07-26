// School management routes
const { requireRole } = require('../utils/role');
const SchoolModel = require('../models/school');
const superAdminCheck = requireRole(['super_admin']);
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

async function schoolRouter(req, res) {
  // Update school (super_admin only)
  if (req.url.startsWith('/schools/') && req.method === 'PUT') {
    if (await superAdminCheck(req, res)) return true;
    const schoolId = req.url.split('/')[2];
    const body = await parseBody(req);
    if (!body.name || !body.address) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const result = await SchoolModel.update(schoolId, { name: body.name, address: body.address });
    if (result.modifiedCount === 1) {
      await recordAuditLog({
        userId: req.user?.userId || 'super_admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Update School',
        details: `SchoolId: ${schoolId}, New Name: ${body.name}, New Address: ${body.address}`
      });
      res.writeHead(200); res.end('School updated');
    } else {
      res.writeHead(404); res.end('School not found');
    }
    return true;
  }

  // Delete school (super_admin only)
  if (req.url.startsWith('/schools/') && req.method === 'DELETE') {
    if (await superAdminCheck(req, res)) return true;
    const schoolId = req.url.split('/')[2];
    const { getDb } = require('../utils/mongo');
    const db = getDb();
    // Try both string and ObjectId for _id
    let deleteResult = await db.collection('schools').deleteOne({ _id: schoolId });
    if (deleteResult.deletedCount === 0) {
      try {
        const { ObjectId } = require('mongodb');
        deleteResult = await db.collection('schools').deleteOne({ _id: new ObjectId(schoolId) });
      } catch {}
    }
    if (deleteResult.deletedCount === 1) {
      await db.collection('users').deleteMany({ schoolId });
      await recordAuditLog({
        userId: req.user?.userId || 'super_admin',
        userName: req.user?.name || 'Super Admin',
        action: 'Delete School',
        details: `SchoolId: ${schoolId}`
      });
      res.writeHead(200); res.end('School deleted');
    } else {
      res.writeHead(404); res.end('School not found');
    }
    return true;
  }
  // Create school and its admin (super_admin only)
  if (req.url === '/schools' && req.method === 'POST') {
    if (await superAdminCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.name || !body.address) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    // Generate schoolId (e.g., SCH001)
    const allSchools = await SchoolModel.getAll();
    const schoolNum = (allSchools.length + 1).toString().padStart(3, '0');
    const schoolId = `SCH${schoolNum}`;
    // Generate admin ID and password
    const adminId = `${schoolId}-ADMIN`;
    const adminPassword = Math.random().toString(36).slice(-8);
    // Create school admin user
    const { hashPassword } = require('../utils/auth');
    const UserModel = require('../models/user');
    const adminUser = {
      name: body.adminName || 'School Admin',
      email: body.adminEmail || `${adminId.toLowerCase()}@edunest.com`,
      userId: adminId,
      password: hashPassword(adminPassword),
      role: 'admin',
      schoolId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await UserModel.create(adminUser);
    // Create school
    await SchoolModel.create({
      _id: schoolId,
      name: body.name,
      address: body.address,
      adminId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await recordAuditLog({
      userId: req.user?.userId || 'super_admin',
      userName: req.user?.name || 'Super Admin',
      action: 'Create School',
      details: `SchoolId: ${schoolId}, Name: ${body.name}, Address: ${body.address}, AdminId: ${adminId}`
    });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'School and admin created',
      schoolId,
      adminId,
      adminPassword
    }));
    return true;
  }
  // List all schools (super_admin only)
  if (req.url === '/schools' && req.method === 'GET') {
    if (await superAdminCheck(req, res)) return true;
    const schools = await SchoolModel.getAll();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(schools));
    return true;
  }
  return false;
}

module.exports = schoolRouter;
