// Auth utilities: password hashing and JWT (Node.js native)
const crypto = require('crypto');
const SECRET = 'your_jwt_secret_key'; // Change to a secure value in production

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, hashed) {
  const [salt, hash] = hashed.split(':');
  const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJWT(payload, expiresIn = '1d') {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + (expiresIn === '1d' ? 86400 : parseInt(expiresIn));
  const body = { ...payload, exp };
  const payloadStr = base64url(JSON.stringify(body));
  const data = `${header}.${payloadStr}`;
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${signature}`;
}

function verifyJWT(token) {
  const [header, payload, signature] = token.split('.');
  const data = `${header}.${payload}`;
  const validSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (signature !== validSig) return null;
  const payloadObj = JSON.parse(Buffer.from(payload, 'base64').toString());
  if (payloadObj.exp < Math.floor(Date.now() / 1000)) return null;
  return payloadObj;
}

module.exports = { hashPassword, verifyPassword, signJWT, verifyJWT };
