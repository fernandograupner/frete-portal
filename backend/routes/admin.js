const router = require('express').Router();
const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const {
  erroColunaLoginAusente,
  listarUsuariosParaAdmin,
} = require('../utils/usuarioLoginCompat');
const { autenticar, soAdmin } = require('../middlewares/auth');

router.use(autenticar, soAdmin);

// ── MESSORREGIÕES ─────────────────────────────────
router.get('/messorregioes', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM messorregioes ORDER BY uf, nome');
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

// ── TARIFAS ───────────────────────────────────────
router.get('/tarifas', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.*, m.nome AS meso_nome, m.uf FROM tarifas t
       JOIN messorregioes m ON m.id = t.meso_id
       WHERE t.vigencia_fim IS NULL ORDER BY m.uf, m.nome, t.faixa_min`
    );
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

router.post('/tarifas', async (req, res, next) => {
  try {
    const { meso_id, faixa_min, faixa_max, valor_m3 } = req.body;
    await db.execute(
      'UPDATE tarifas SET vigencia_fim = CURDATE() WHERE meso_id=? AND faixa_min=? AND faixa_max=? AND vigencia_fim IS NULL',
      [meso_id, faixa_min, faixa_max]
    );
    const [ins] = await db.execute(
      'INSERT INTO tarifas (meso_id, faixa_min, faixa_max, valor_m3) VALUES (?,?,?,?)',
      [meso_id, faixa_min, faixa_max, valor_m3]
    );
    res.status(201).json({ sucesso: true, id: ins.insertId });
  } catch (err) { next(err); }
});

router.put('/tarifas/:id', async (req, res, next) => {
  try {
    const { valor_m3 } = req.body;
    const [chk] = await db.execute(
      'SELECT id FROM tarifas WHERE id = ? AND vigencia_fim IS NULL',
      [req.params.id]
    );
    if (!chk.length)
      return res.status(404).json({ sucesso: false, erro: 'Tarifa não encontrada ou já encerrada.' });
    await db.execute(
      'UPDATE tarifas SET valor_m3 = ? WHERE id = ? AND vigencia_fim IS NULL',
      [valor_m3, req.params.id]
    );
    res.json({ sucesso: true, mensagem: 'Tarifa atualizada.' });
  } catch (err) { next(err); }
});

router.delete('/tarifas/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'UPDATE tarifas SET vigencia_fim = CURDATE() WHERE id = ? AND vigencia_fim IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ sucesso: false, erro: 'Tarifa não encontrada.' });
    res.json({ sucesso: true, mensagem: 'Tarifa encerrada (removida da vigência atual).' });
  } catch (err) { next(err); }
});

router.get('/pedagios', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, m.nome AS meso_nome, m.uf FROM pedagios p
       JOIN messorregioes m ON m.id = p.meso_id
       WHERE p.vigencia_fim IS NULL ORDER BY m.uf, m.nome`
    );
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

router.put('/pedagios/:mesoId', async (req, res, next) => {
  try {
    const { valor_por_m3, observacao } = req.body;
    await db.execute(
      'UPDATE pedagios SET vigencia_fim = CURDATE() WHERE meso_id=? AND vigencia_fim IS NULL',
      [req.params.mesoId]
    );
    await db.execute(
      'INSERT INTO pedagios (meso_id, valor_por_m3, observacao) VALUES (?,?,?)',
      [req.params.mesoId, valor_por_m3, observacao || null]
    );
    res.json({ sucesso: true, mensagem: 'Pedágio atualizado.' });
  } catch (err) { next(err); }
});

// ── CLIENTES ──────────────────────────────────────
router.get('/clientes', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, ci.nome AS cidade_nome, m.nome AS meso_nome FROM clientes c
       LEFT JOIN cidades ci ON ci.id = c.cidade_id
       LEFT JOIN messorregioes m ON m.id = ci.meso_id
       ORDER BY c.nome_fantasia, c.nome`
    );
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

router.put('/clientes/:id', async (req, res, next) => {
  try {
    const {
      cnpj, codigo, loja, nome, nome_fantasia, municipio, uf,
      tipo_frete, paletizado, dedicado, cidade_id, ativo,
    } = req.body;
    await db.execute(
      `UPDATE clientes SET cnpj=?,codigo=?,loja=?,nome=?,nome_fantasia=?,municipio=?,uf=?,
       tipo_frete=?,paletizado=?,dedicado=?,cidade_id=?,ativo=? WHERE id=?`,
      [
        cnpj, codigo, loja ?? null, nome, nome_fantasia ?? null,
        municipio, String(uf || '').toUpperCase().slice(0, 2),
        tipo_frete === 'FOB' ? 'FOB' : 'CIF',
        paletizado ? 1 : 0, dedicado ? 1 : 0,
        cidade_id ? Number(cidade_id) : null,
        ativo === undefined || ativo ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ sucesso: true, mensagem: 'Cliente atualizado.' });
  } catch (err) { next(err); }
});

router.delete('/clientes/:id', async (req, res, next) => {
  try {
    const [[{ n }]] = await db.execute(
      'SELECT COUNT(*) AS n FROM calculos WHERE cliente_id = ?',
      [req.params.id]
    );
    if (n > 0) {
      await db.execute('UPDATE clientes SET ativo = 0 WHERE id = ?', [req.params.id]);
      return res.json({
        sucesso: true,
        mensagem: 'Cliente desativado (há cálculos vinculados; não é possível excluir).',
      });
    }
    await db.execute('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    res.json({ sucesso: true, mensagem: 'Cliente removido.' });
  } catch (err) { next(err); }
});

router.post('/clientes', async (req, res, next) => {
  try {
    const { cnpj, codigo, loja, nome, nome_fantasia, municipio, uf, tipo_frete, paletizado, dedicado, cidade_id } = req.body;
    const [ins] = await db.execute(
      `INSERT INTO clientes (cnpj,codigo,loja,nome,nome_fantasia,municipio,uf,tipo_frete,paletizado,dedicado,cidade_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [cnpj, codigo, loja||null, nome, nome_fantasia||null, municipio, uf, tipo_frete||'CIF', paletizado||0, dedicado||0, cidade_id||null]
    );
    res.status(201).json({ sucesso: true, id: ins.insertId });
  } catch (err) { next(err); }
});

// ── ICMS ──────────────────────────────────────────
router.get('/icms', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM icms_uf ORDER BY uf');
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

router.put('/icms/:uf', async (req, res, next) => {
  try {
    const { aliquota, observacao } = req.body;
    await db.execute(
      'INSERT INTO icms_uf (uf,aliquota,observacao) VALUES (?,?,?) ON DUPLICATE KEY UPDATE aliquota=?,observacao=?',
      [req.params.uf, aliquota, observacao, aliquota, observacao]
    );
    res.json({ sucesso: true, mensagem: 'ICMS atualizado.' });
  } catch (err) { next(err); }
});

// ── USUÁRIOS ──────────────────────────────────────
router.get('/usuarios', async (req, res, next) => {
  try {
    const rows = await listarUsuariosParaAdmin();
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

router.post('/usuarios', async (req, res, next) => {
  try {
    const { nome, login, email, senha, perfil } = req.body;
    const loginNorm = String(login ?? '')
      .trim()
      .toLowerCase();
    if (!nome || !loginNorm || !email || !senha)
      return res.status(400).json({ sucesso: false, erro: 'Nome, usuário, e-mail e senha são obrigatórios.' });
    if (!/^[a-z0-9._-]{3,80}$/.test(loginNorm))
      return res.status(400).json({
        sucesso: false,
        erro: 'Usuário inválido (use 3–80 caracteres: letras minúsculas, números, . _ -).',
      });
    const hash = await bcrypt.hash(senha, 12);
    const [ins] = await db.execute(
      'INSERT INTO usuarios (nome,login,email,senha_hash,perfil) VALUES (?,?,?,?,?)',
      [nome, loginNorm, email.trim().toLowerCase(), hash, perfil || 'user']
    );
    res.status(201).json({ sucesso: true, id: ins.insertId });
  } catch (err) {
    if (erroColunaLoginAusente(err))
      return res.status(503).json({
        sucesso: false,
        erro:
          'A coluna usuarios.login não existe neste banco. Execute database/migration_usuario_login.sql (instruções em database/README.md).',
      });
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ sucesso: false, erro: 'Usuário ou e-mail já cadastrado.' });
    next(err);
  }
});

router.put('/usuarios/:id', async (req, res, next) => {
  try {
    const { nome, perfil, ativo } = req.body;
    await db.execute('UPDATE usuarios SET nome=?,perfil=?,ativo=? WHERE id=?', [nome, perfil, ativo, req.params.id]);
    res.json({ sucesso: true, mensagem: 'Usuário atualizado.' });
  } catch (err) { next(err); }
});

router.delete('/usuarios/:id', async (req, res, next) => {
  try {
    const uid = parseInt(req.params.id, 10);
    if (uid === Number(req.usuario.id))
      return res.status(400).json({ sucesso: false, erro: 'Não é possível remover o próprio usuário.' });
    const [[{ n }]] = await db.execute(
      'SELECT COUNT(*) AS n FROM calculos WHERE usuario_id = ?',
      [uid]
    );
    if (n > 0) {
      await db.execute('UPDATE usuarios SET ativo = 0 WHERE id = ?', [uid]);
      return res.json({
        sucesso: true,
        mensagem: 'Usuário desativado (há histórico de cálculos).',
      });
    }
    await db.execute('DELETE FROM usuarios WHERE id = ?', [uid]);
    res.json({ sucesso: true, mensagem: 'Usuário removido.' });
  } catch (err) { next(err); }
});

// ── HISTÓRICO (admin vê tudo) ─────────────────────
router.get('/calculos', async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limite = Math.min(100, parseInt(req.query.limite, 10) || 20);
    const offset = (page - 1) * limite;
    const safeLimite = Number.isFinite(limite) && limite > 0 ? Math.trunc(limite) : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.trunc(offset) : 0;
    const [rows] = await db.execute(
      `SELECT cal.id, cal.codigo_m3, cal.valor_nf, cal.m3, cal.vl_total, cal.created_at,
              c.nome_fantasia AS cliente, ci.nome AS cidade, ci.uf, u.nome AS usuario
       FROM calculos cal
       JOIN clientes c ON c.id = cal.cliente_id
       JOIN cidades ci ON ci.id = cal.cidade_id
       JOIN usuarios u ON u.id = cal.usuario_id
       ORDER BY cal.created_at DESC LIMIT ${safeLimite} OFFSET ${safeOffset}`
    );
    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM calculos');
    res.json({ sucesso: true, dados: rows, total: Number(total ?? 0), page, limite });
  } catch (err) { next(err); }
});

module.exports = router;
