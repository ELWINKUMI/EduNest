// server/routes/subject.js
const { requireRole } = require('../utils/role');
const SubjectModel = require('../models/subject');
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
  // Create subject
  if (req.url === '/subjects' && req.method === 'POST') {
    if (await adminCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.name) { res.writeHead(400); res.end('Missing subject name'); return true; }
    await SubjectModel.create({ name: body.name, schoolId: req.user.schoolId });
    res.writeHead(201); res.end('Subject created');
    return true;
  }
  // List subjects
  if (req.url === '/subjects' && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const subjects = await SubjectModel.getAll(req.user.schoolId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(subjects));
    return true;
  }
  // Update subject
  if (req.url.startsWith('/subjects/') && req.method === 'PUT') {
    if (await adminCheck(req, res)) return true;
    const subjectId = req.url.split('/')[2];
    const body = await parseBody(req);
    await SubjectModel.update(subjectId, body);
    res.writeHead(200); res.end('Subject updated');
    return true;
  }
  // Delete subject
  if (req.url.startsWith('/subjects/') && req.method === 'DELETE') {
    if (await adminCheck(req, res)) return true;
    const subjectId = req.url.split('/')[2];
    await SubjectModel.delete(subjectId);
    res.writeHead(200); res.end('Subject deleted');
    return true;
  }
  return false;
};
