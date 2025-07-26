// Entry point for EduNest LMS backend
// Native Node.js modules only (no Express)

const http = require('http');
const { connectToMongo } = require('./server/utils/mongo');

const PORT = 3000;

// Connect to MongoDB
connectToMongo().then(() => {
  console.log('MongoDB connected');
  // Start HTTP server
  const authRouter = require('./server/routes/auth');
  const meRouter = require('./server/routes/me');
  const adminOnlyRouter = require('./server/routes/adminOnly');
  const superAdminOnlyRouter = require('./server/routes/superAdminOnly');
  const teacherOnlyRouter = require('./server/routes/teacherOnly');
  const studentOnlyRouter = require('./server/routes/studentOnly');
  const schoolRouter = require('./server/routes/school');
  const userRouter = require('./server/routes/user');
  const courseRouter = require('./server/routes/course');
  const assignmentRouter = require('./server/routes/assignment');
  const quizRouter = require('./server/routes/quiz');
  const uploadRouter = require('./server/routes/upload');
  const reportRouter = require('./server/routes/report');
  const announcementRouter = require('./server/routes/announcement');
  const auditLogRouter = require('./server/routes/auditlog');
  const classRouter = require('./server/routes/classes');
  const subjectRouter = require('./server/routes/subjects');
  const teacherAssignmentRouter = require('./server/routes/teacherAssignment');
  const path = require('path');
  const fs = require('fs');
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
  };
  const server = http.createServer(async (req, res) => {
    // Direct route for one-time admin userId fix
    if (req.url === '/fix-admin-userids' && req.method === 'POST') {
      if (await userRouter(req, res)) return;
    }
    // Serve static files from /client (frontend)
    if (req.url.startsWith('/client/')) {
      const filePath = path.join(__dirname, req.url.replace(/\?.*$/, ''));
      if (filePath.indexOf(path.join(__dirname, 'client')) !== 0) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      return;
    }
    // Route: /register and /login
    if (await authRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /me (protected)
    if (await meRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /admin-only (admin/super_admin only)
    if (await adminOnlyRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /super-admin-only (super_admin only)
    if (await superAdminOnlyRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /teacher-only (teacher only)
    if (await teacherOnlyRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /student-only (student only)
    if (await studentOnlyRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /schools (super_admin only)
    if (await schoolRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /users (admin only)
    if (await userRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /courses (teacher only) and /student-courses (student only)
    if (await courseRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /assignments, /student-assignments, /submit-assignment
    if (await assignmentRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /quizzes, /student-quizzes, /submit-quiz
    if (await quizRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /upload-material, /materials, /uploads
    if (await uploadRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /report endpoints
    if (await reportRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /announcements (teacher/admin post, student view)
    if (await announcementRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /auditlog (super_admin only)
    if (await auditLogRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /classes (school admin only)
    if (await classRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /subjects (school admin only)
    if (await subjectRouter(req, res)) return;
    if (res.writableEnded) return;
    // Route: /teacher-assignments (school admin only)
    if (await teacherAssignmentRouter(req, res)) return;
    if (res.writableEnded) return;
    // Default response
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('EduNest LMS Backend Running');
  });
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});
