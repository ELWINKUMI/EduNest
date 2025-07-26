// File upload and resource management routes
const { requireRole } = require('../utils/role');
const CourseModel = require('../models/course');
const teacherCheck = requireRole(['teacher']);
const studentCheck = requireRole(['student']);
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');

// Helper: parse multipart form data (very basic, for single file)
function parseMultipart(req, boundary) {
  return new Promise((resolve) => {
    let data = Buffer.alloc(0);
    req.on('data', chunk => { data = Buffer.concat([data, chunk]); });
    req.on('end', () => {
      const parts = data.toString().split('--' + boundary);
      for (const part of parts) {
        if (part.includes('filename="')) {
          const match = part.match(/filename="([^"]+)"/);
          if (!match) continue;
          const filename = match[1];
          const fileStart = part.indexOf('\r\n\r\n') + 4;
          const fileEnd = part.lastIndexOf('\r\n');
          const fileData = part.slice(fileStart, fileEnd);
          return resolve({ filename, fileData: Buffer.from(fileData, 'binary') });
        }
      }
      resolve(null);
    });
  });
}

async function uploadRouter(req, res) {
  // Teacher: upload file and attach to course
  if (req.url.startsWith('/upload-material') && req.method === 'POST') {
    if (await teacherCheck(req, res)) return true;
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const courseId = urlObj.searchParams.get('courseId');
    if (!courseId) { res.writeHead(400); res.end('Missing courseId'); return true; }
    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) { res.writeHead(400); res.end('Missing boundary'); return true; }
    const file = await parseMultipart(req, boundary);
    if (!file) { res.writeHead(400); res.end('No file uploaded'); return true; }
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const savePath = path.join(uploadsDir, Date.now() + '-' + file.filename);
    fs.writeFileSync(savePath, file.fileData);
    // Attach file URL to course
    const course = await CourseModel.findById(courseId);
    if (!course) { res.writeHead(404); res.end('Course not found'); return true; }
    course.materials = course.materials || [];
    course.materials.push(savePath.replace(/\\/g, '/'));
    await CourseModel.update(courseId, { materials: course.materials });
    res.writeHead(201); res.end('File uploaded and attached');
    return true;
  }
  // Student: list/download course materials
  if (req.url.startsWith('/materials?courseId=') && req.method === 'GET') {
    if (await studentCheck(req, res)) return true;
    const courseId = req.url.split('=')[1];
    const course = await CourseModel.findById(courseId);
    if (!course) { res.writeHead(404); res.end('Course not found'); return true; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(course.materials || []));
    return true;
  }
  // Public: download file
  if (req.url.startsWith('/uploads/') && req.method === 'GET') {
    const filePath = path.join(uploadsDir, req.url.replace('/uploads/', ''));
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('File not found'); return true; }
    const stream = fs.createReadStream(filePath);
    res.writeHead(200);
    stream.pipe(res);
    return true;
  }
  return false;
}

module.exports = uploadRouter;
