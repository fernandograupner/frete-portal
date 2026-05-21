const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const skipLogin =
    process.env.SKIP_LOGIN === '1' ||
    process.env.SKIP_LOGIN === 'true' ||
    process.env.SKIP_LOGIN === 'yes';
  if (skipLogin) {
    req.usuario = {
      id: Number(process.env.SKIP_LOGIN_USER_ID || 1),
      nome: process.env.SKIP_LOGIN_NOME || 'Administrador',
      login: process.env.SKIP_LOGIN_LOGIN || 'dev',
      email: process.env.SKIP_LOGIN_EMAIL || 'dev@local',
      perfil: process.env.SKIP_LOGIN_PERFIL === 'user' ? 'user' : 'admin',
    };
    return next();
  }

  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ sucesso: false, erro: 'Token não informado. Faça login.' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'segredo_dev');
    if (req.usuario && req.usuario.id != null && req.usuario.id !== '')
      req.usuario.id = Number(req.usuario.id);
    next();
  } catch {
    res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado.' });
  }
}

function soAdmin(req, res, next) {
  if (req.usuario?.perfil !== 'admin')
    return res.status(403).json({ sucesso: false, erro: 'Acesso restrito a administradores.' });
  next();
}

module.exports = { autenticar, soAdmin };
