// Auth routes: /register and /login
const { register, login } = require('../controllers/authController');

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

async function authRouter(req, res) {
  if (req.url === '/register' && req.method === 'POST') {
    const body = await parseBody(req);
    await register(req, res, body);
    return true;
  }
  if (req.url === '/login' && req.method === 'POST') {
    const body = await parseBody(req);
    await login(req, res, body);
    return true;
  }
  return false;
}

module.exports = authRouter;
