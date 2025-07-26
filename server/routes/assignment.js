// Assignment management routes
const { requireRole } = require('../utils/role');
const AssignmentModel = require('../models/assignment');
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

async function assignmentRouter(req, res) {
  // Teacher: create assignment
  if (req.url === '/assignments' && req.method === 'POST') {
    if (await teacherCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.title || !body.courseId || !body.description || !body.dueDate) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const assignment = {
      title: body.title,
      courseId: body.courseId,
      description: body.description,
      fileAttachment: body.fileAttachment || null,
      dueDate: body.dueDate,
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await AssignmentModel.create(assignment);
    res.writeHead(201); res.end('Assignment created');
    return true;
  }
  // Teacher: list assignments for a course
  if (req.url.startsWith('/assignments?courseId=') && req.method === 'GET') {
    if (await teacherCheck(req, res)) return true;
    const courseId = req.url.split('=')[1];
    const assignments = await AssignmentModel.findByCourse(courseId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(assignments));
    return true;
  }
  // Student: list assignments for their courses
  if (req.url === '/student-assignments' && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    const student = await UserModel.findById(req.user.id);
    if (!student || !student.assignedClass) {
      res.writeHead(404); res.end('Student or class not found'); return true;
    }
    // Find all assignments for courses matching student's class
    const CourseModel = require('../models/course');
    const courses = await CourseModel.findByClassLevel(student.assignedClass, req.user.schoolId);
    const courseIds = courses.map(c => c._id);
    const allAssignments = [];
    for (const courseId of courseIds) {
      const assignments = await AssignmentModel.findByCourse(courseId);
      allAssignments.push(...assignments);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allAssignments));
    return true;
  }
  // Student: submit assignment
  if (req.url === '/submit-assignment' && req.method === 'POST') {
    if (await studentCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.assignmentId || !body.fileUrl) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const assignment = await AssignmentModel.findById(body.assignmentId);
    if (!assignment) {
      res.writeHead(404); res.end('Assignment not found'); return true;
    }
    assignment.submissions.push({
      studentId: req.user.id,
      fileUrl: body.fileUrl,
      grade: null,
      feedback: null
    });
    await AssignmentModel.update(body.assignmentId, { submissions: assignment.submissions });
    res.writeHead(200); res.end('Assignment submitted');
    return true;
  }
  return false;
}

module.exports = assignmentRouter;
