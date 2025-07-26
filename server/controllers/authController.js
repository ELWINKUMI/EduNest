// Auth controller: registration and login
const UserModel = require('../models/user');
const { hashPassword, verifyPassword, signJWT } = require('../utils/auth');

async function register(req, res, body) {
  const { name, email, password, role, schoolId } = body;
  if (!name || !email || !password || !role || !schoolId) {
    res.writeHead(400); res.end('Missing fields'); return;
  }
  const existing = await UserModel.findByEmail(email);
  if (existing) { res.writeHead(409); res.end('Email exists'); return; }
  const hashed = hashPassword(password);
  const user = { name, email, password: hashed, role, schoolId, createdAt: new Date(), updatedAt: new Date() };
  await UserModel.create(user);
  res.writeHead(201); res.end('Registered');
}

async function login(req, res, body) {
  const { userId, password } = body;
  if (!userId || !password) {
    res.writeHead(400); res.end('Missing fields'); return;
  }
  const user = await UserModel.findByUserId(userId);
  if (!user || !verifyPassword(password, user.password)) {
    res.writeHead(401); res.end('Invalid credentials'); return;
  }
  const token = signJWT({ id: user._id.toString(), role: user.role, schoolId: user.schoolId });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ token, role: user.role, name: user.name }));
}

module.exports = { register, login };
