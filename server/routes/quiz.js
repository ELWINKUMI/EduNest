// Quiz management routes
const { requireRole } = require('../utils/role');
const QuizModel = require('../models/quiz');
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

async function quizRouter(req, res) {
  // Teacher: create quiz
  if (req.url === '/quizzes' && req.method === 'POST') {
    if (await teacherCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.title || !body.courseId || !body.questions || !body.duration || !body.dueDate) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const quiz = {
      title: body.title,
      courseId: body.courseId,
      questions: body.questions,
      duration: body.duration,
      teacherId: req.user.id,
      dueDate: body.dueDate,
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await QuizModel.create(quiz);
    res.writeHead(201); res.end('Quiz created');
    return true;
  }
  // Teacher: list quizzes for a course
  if (req.url.startsWith('/quizzes?courseId=') && req.method === 'GET') {
    if (await teacherCheck(req, res)) return true;
    const courseId = req.url.split('=')[1];
    const quizzes = await QuizModel.findByCourse(courseId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(quizzes));
    return true;
  }
  // Student: list quizzes for their courses
  if (req.url === '/student-quizzes' && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    const student = await UserModel.findById(req.user.id);
    if (!student || !student.assignedClass) {
      res.writeHead(404); res.end('Student or class not found'); return true;
    }
    // Find all quizzes for courses matching student's class
    const CourseModel = require('../models/course');
    const courses = await CourseModel.findByClassLevel(student.assignedClass, req.user.schoolId);
    const courseIds = courses.map(c => c._id);
    const allQuizzes = [];
    for (const courseId of courseIds) {
      const quizzes = await QuizModel.findByCourse(courseId);
      allQuizzes.push(...quizzes);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allQuizzes));
    return true;
  }
  // Student: submit quiz answers
  if (req.url === '/submit-quiz' && req.method === 'POST') {
    if (await studentCheck(req, res)) return true;
    const body = await parseBody(req);
    if (!body.quizId || !body.answers) {
      res.writeHead(400); res.end('Missing fields'); return true;
    }
    const quiz = await QuizModel.findById(body.quizId);
    if (!quiz) {
      res.writeHead(404); res.end('Quiz not found'); return true;
    }
    // Score the quiz
    let score = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (quiz.questions[i].correctAnswer === body.answers[i]) score += quiz.questions[i].marks || 1;
    }
    quiz.responses.push({
      studentId: req.user.id,
      answers: body.answers,
      score
    });
    await QuizModel.update(body.quizId, { responses: quiz.responses });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Quiz submitted', score }));
    return true;
  }
  return false;
}

module.exports = quizRouter;
