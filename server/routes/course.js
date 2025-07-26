// Course management routes
const { requireRole } = require('../utils/role');
const CourseModel = require('../models/course');
const UserModel = require('../models/user');
const teacherCheck = requireRole(['teacher']);
const studentCheck = requireRole(['student']);

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

async function courseRouter(req, res) {
  // Create course (teacher only)
  if (req.url === '/courses' && req.method === 'POST') {
    if (await teacherCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.title || !body.classLevel || !body.subject) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const course = {
      title: body.title,
      classLevel: body.classLevel,
      subject: body.subject,
      teacherId: req.user.id,
      schoolId: req.user.schoolId,
      materials: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await CourseModel.create(course);
    res.writeHead(201); res.end('Course created');
    return true;
  }
  // List courses for teacher (teacher only)
  if (req.url === '/courses' && req.method === 'GET') {
    if (await teacherCheck(req, res)) return true;
    const courses = await CourseModel.findByTeacher(req.user.id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(courses));
    return true;
  }
  // List courses for student (student only)
  if (req.url === '/student-courses' && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    const student = await UserModel.findById(req.user.id);
    if (!student || !student.assignedClass) {
      res.writeHead(404); res.end('Student or class not found'); return true;
    }
    const courses = await CourseModel.findByClassLevel(student.assignedClass, req.user.schoolId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(courses));
    return true;
  }
  return false;
}

module.exports = courseRouter;
