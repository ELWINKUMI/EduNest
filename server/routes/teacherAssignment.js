// server/routes/teacherAssignment.js
const { requireRole } = require('../utils/role');
const TeacherAssignmentModel = require('../models/teacherAssignment');
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
  // Assign teacher to classes and subjects
  if (req.url === '/teacher-assignments' && req.method === 'POST') {
    if (await adminCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.teacherId || !Array.isArray(body.classIds) || !Array.isArray(body.subjectIds)) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    await TeacherAssignmentModel.assign(body.teacherId, body.classIds, body.subjectIds);
    res.writeHead(201); res.end('Teacher assignments updated');
    return true;
  }
  // Get assignments by teacher
  if (req.url.startsWith('/teacher-assignments/teacher/') && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const teacherId = req.url.split('/')[3];
    const assignments = await TeacherAssignmentModel.getByTeacher(teacherId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(assignments));
    return true;
  }
  // Get assignments by class
  if (req.url.startsWith('/teacher-assignments/class/') && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const classId = req.url.split('/')[3];
    const assignments = await TeacherAssignmentModel.getByClass(classId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(assignments));
    return true;
  }
  // Get assignments by subject
  if (req.url.startsWith('/teacher-assignments/subject/') && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const subjectId = req.url.split('/')[3];
    const assignments = await TeacherAssignmentModel.getBySubject(subjectId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(assignments));
    return true;
  }
  return false;
};
