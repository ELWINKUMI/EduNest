// server/routes/class.js
const { requireRole } = require('../utils/role');
const ClassModel = require('../models/class');
const adminCheck = requireRole(['admin']);

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

module.exports = async function(req, res) {
  // Create class
  if (req.url === '/classes' && req.method === 'POST') {
    if (await adminCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.name) { res.writeHead(400); res.end('Missing class name'); return true; }
    await ClassModel.create({ name: body.name, schoolId: req.user.schoolId });
    res.writeHead(201); res.end('Class created');
    return true;
  }
  // List classes
  if (req.url === '/classes' && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const classes = await ClassModel.getAll(req.user.schoolId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(classes));
    return true;
  }
  // Update class
  if (req.url.startsWith('/classes/') && req.method === 'PUT') {
    if (await adminCheck(req, res)) return true;
    const classId = req.url.split('/')[2];
    const body = await parseBody(req);
    await ClassModel.update(classId, body);
    res.writeHead(200); res.end('Class updated');
    return true;
  }
  // Delete class
  if (req.url.startsWith('/classes/') && req.method === 'DELETE') {
    if (await adminCheck(req, res)) return true;
    const classId = req.url.split('/')[2];
    await ClassModel.delete(classId);
    res.writeHead(200); res.end('Class deleted');
    return true;
  }
  return false;
};
