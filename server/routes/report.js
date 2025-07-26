// Reporting and analytics routes
const { requireRole } = require('../utils/role');
const CourseModel = require('../models/course');
const AssignmentModel = require('../models/assignment');
const QuizModel = require('../models/quiz');
const UserModel = require('../models/user');
const adminCheck = requireRole(['admin']);
const teacherCheck = requireRole(['teacher']);
const studentCheck = requireRole(['student']);

async function reportRouter(req, res) {
  // Admin: school-wide analytics
  if (req.url === '/report/school' && req.method === 'GET') {
    if (await adminCheck(req, res)) return true;
    const users = await UserModel.findBySchool(req.user.schoolId);
    const teachers = users.filter(u => u.role === 'teacher').length;
    const students = users.filter(u => u.role === 'student').length;
    const courses = await CourseModel.findBySchool(req.user.schoolId);
    const assignments = [];
    for (const course of courses) {
      const a = await AssignmentModel.findByCourse(course._id);
      assignments.push(...a);
    }
    const quizzes = [];
    for (const course of courses) {
      const q = await QuizModel.findByCourse(course._id);
      quizzes.push(...q);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ teachers, students, courses: courses.length, assignments: assignments.length, quizzes: quizzes.length }));
    return true;
  }
  // Teacher: student performance in their courses
  if (req.url === '/report/teacher' && req.method === 'GET') {
    if (await teacherCheck(req, res)) return true;
    const courses = await CourseModel.findByTeacher(req.user.id);
    const report = [];
    for (const course of courses) {
      const quizzes = await QuizModel.findByCourse(course._id);
      const assignments = await AssignmentModel.findByCourse(course._id);
      report.push({ course, quizzes, assignments });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
    return true;
  }
  // Student: their own progress
  if (req.url === '/report/student' && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    const quizzes = await QuizModel.findAllWithStudent(req.user.id);
    const assignments = await AssignmentModel.findAllWithStudent(req.user.id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ quizzes, assignments }));
    return true;
  }
  return false;
}

module.exports = reportRouter;
