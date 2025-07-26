// Classes API routes
const { getDb } = require('../utils/mongo');
const { verifyJWT } = require('../utils/auth');

module.exports = async function(req, res) {
  const db = await getDb();
  let user = null;
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    user = token ? verifyJWT(token) : null;
  } catch (e) {
    user = null;
  }
  if (!user) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (req.method === 'GET') {
    // List classes
    const classes = await db.collection('classes').find({}).toArray();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ classes }));
    return;
  }
  if (req.method === 'POST') {
    // Create class
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { name } = JSON.parse(body);
        if (!name) throw new Error('Name required');
        const result = await db.collection('classes').insertOne({ name });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ classId: result.insertedId }));
      } catch (err) {
        res.writeHead(400);
        res.end(err.message);
      }
    });
    return;
  }
  if (req.method === 'DELETE') {
    // Delete class
    const id = req.url.split('/').pop();
    if (!id) {
      res.writeHead(400);
      res.end('Class ID required');
      return;
    }
    await db.collection('classes').deleteOne({ _id: require('mongodb').ObjectId(id) });
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(405);
  res.end('Method Not Allowed');
};
