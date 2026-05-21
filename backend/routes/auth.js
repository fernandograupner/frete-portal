const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { autenticar } = require('../middlewares/auth');
const { buscarUsuarioPorCredencial } = require('../utils/usuarioLoginCompat');

function normalizarLogin(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase();
}

// POST /api/auth/login — usa campo `login` (nome de usuário), ex.: fernando.alves
router.post('/login', async (req, res, next) => {
  try {
    const loginIdent = normalizarLogin(req.body.login ?? req.body.usuario ?? req.body.email);
    const { senha } = req.body;
    if (!loginIdent || !senha)
      return res.status(400).json({ sucesso: false, erro: 'Usuário e senha obrigatórios.' });

    const pareceNomeUsuario =
      /^[a-z0-9][a-z0-9._-]{2,79}$/.test(loginIdent) && !loginIdent.includes('@');

    const { usuario, modoLegadoSemColunaLogin } = await buscarUsuarioPorCredencial(loginIdent);
    if (!usuario) {
      if (modoLegadoSemColunaLogin && pareceNomeUsuario)
        return res.status(503).json({
          sucesso: false,
          erro:
            'Este banco ainda não tem a coluna usuarios.login. Rode database/migration_usuario_login.sql no MySQL (veja database/README.md). Até lá, entre com o e-mail do usuário (ex.: admin@drylock.com.br).',
        });
      return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok) return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });

    const loginJwt =
      usuario.login ?? (String(usuario.email || '').split('@')[0] || '');

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        login: loginJwt,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET || 'segredo_dev',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: loginJwt,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED')
      return res.status(503).json({ sucesso: false, erro: 'Não foi possível conectar ao MySQL (serviço rodando?).' });
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR')
      return res.status(503).json({
        sucesso: false,
        erro: 'Acesso ao banco negado. No arquivo backend/.env defina DB_USER e DB_PASS (senha correta do MySQL para esse usuário) e reinicie o servidor.',
      });
    if (err.code === 'ER_BAD_DB_ERROR')
      return res.status(503).json({ sucesso: false, erro: `Banco não encontrado. Crie a base (${process.env.DB_NAME || 'frete_portal'}) com database/schema.sql.` });
    next(err);
  }
});

// POST /api/auth/trocar-senha
router.post('/trocar-senha', autenticar, async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha || novaSenha.length < 6)
      return res.status(400).json({ sucesso: false, erro: 'Nova senha precisa ter ao menos 6 caracteres.' });

    const [rows] = await db.execute('SELECT senha_hash FROM usuarios WHERE id = ?', [req.usuario.id]);
    const ok = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ sucesso: false, erro: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(novaSenha, 12);
    await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, req.usuario.id]);
    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso.' });
  } catch (err) { next(err); }
});

module.exports = router;
