const router            = require('express').Router();
const db                = require('../config/db');
const { autenticar }    = require('../middlewares/auth');
const { calcularFrete } = require('../services/freteService');

router.use(autenticar);

// GET /api/clientes?busca=
router.get('/clientes', async (req, res, next) => {
  try {
    const termo = (req.query.busca || '').trim();
    const listaCompleta = termo === '';

    let sql = `SELECT c.id, c.codigo, c.loja, c.nome, c.nome_fantasia,
              c.municipio, c.uf, c.tipo_frete, c.paletizado, c.dedicado,
              c.cidade_id, ci.nome AS cidade_nome, ci.meso_id, m.nome AS meso_nome
       FROM clientes c
       LEFT JOIN cidades ci ON ci.id = c.cidade_id
       LEFT JOIN messorregioes m ON m.id = ci.meso_id
       WHERE c.ativo = 1`;
    const params = [];

    if (!listaCompleta) {
      const busca = `%${termo}%`;
      sql += ' AND (c.nome_fantasia LIKE ? OR c.nome LIKE ? OR c.codigo LIKE ?)';
      params.push(busca, busca, busca);
      sql += ' ORDER BY c.nome_fantasia, c.nome LIMIT 50';
    } else {
      sql += ' ORDER BY c.nome_fantasia, c.nome';
    }

    const [rows] = await db.execute(sql, params);
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

// GET /api/cidades?busca=
router.get('/cidades', async (req, res, next) => {
  try {
    const busca = `%${(req.query.busca || '').trim()}%`;
    const [rows] = await db.execute(
      `SELECT ci.id, ci.nome, ci.uf, ci.meso_id, m.nome AS meso_nome
       FROM cidades ci
       LEFT JOIN messorregioes m ON m.id = ci.meso_id
       WHERE ci.nome LIKE ?
       ORDER BY ci.uf, ci.nome LIMIT 60`,
      [busca]
    );
    res.json({ sucesso: true, dados: rows });
  } catch (err) { next(err); }
});

// POST /api/calcular
router.post('/calcular', async (req, res, next) => {
  try {
    const usuarioId = Number(req.usuario?.id);
    if (!Number.isFinite(usuarioId))
      return res.status(401).json({ sucesso: false, erro: 'Token inválido: usuário não identificado.' });
    const resultado = await calcularFrete(db, { ...req.body, usuarioId });
    res.json(resultado);
  } catch (err) { err.status = 422; next(err); }
});

// GET /api/calculos?page=1&limite=20&busca=
router.get('/calculos', async (req, res, next) => {
  try {
    const usuarioId = parseInt(String(req.usuario?.id), 10);
    if (!Number.isFinite(usuarioId) || usuarioId < 1)
      return res.status(401).json({ sucesso: false, erro: 'Token inválido: usuário não identificado.' });

    const page   = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limite = Math.min(100, parseInt(req.query.limite, 10) || 20);
    const offset = (page - 1) * limite;
    const safeLimite = Number.isFinite(limite) && limite > 0 ? Math.trunc(limite) : 20;
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? Math.trunc(offset) : 0;
    const busca  = `%${(req.query.busca || '').trim()}%`;
    const de     = typeof req.query.de === 'string' && req.query.de.trim() ? req.query.de.trim() : null;
    const ate    = typeof req.query.ate === 'string' && req.query.ate.trim() ? req.query.ate.trim() : null;

    let where  = 'WHERE cal.usuario_id = ?';
    const params = [usuarioId];

    if (req.query.busca) { where += ' AND (cal.codigo_m3 LIKE ? OR c.nome_fantasia LIKE ? OR c.nome LIKE ?)'; params.push(busca, busca, busca); }
    if (de)  { where += ' AND DATE(cal.created_at) >= ?'; params.push(de); }
    if (ate) { where += ' AND DATE(cal.created_at) <= ?'; params.push(ate); }

    const fromBase = `FROM calculos cal
       JOIN clientes c ON c.id = cal.cliente_id
       JOIN cidades ci ON ci.id = cal.cidade_id
       LEFT JOIN messorregioes m ON m.id = ci.meso_id
       LEFT JOIN usuarios u ON u.id = cal.usuario_id`;

    // pool.query (text protocol + escape) evita erro "Incorrect arguments to mysqld_stmt_execute"
    // do mysql2 em alguns ambientes com prepared statements.
    const [rows] = await db.query(
      `SELECT cal.id, cal.codigo_m3, cal.valor_nf, cal.m3,
              cal.vl_frete_peso, cal.vl_advalorem, cal.vl_pedagio,
              cal.vl_paletizacao, cal.vl_dedicado,
              cal.vl_sem_icms, cal.aliquota_icms, cal.vl_icms, cal.vl_total,
              cal.created_at, cal.paletizado, cal.dedicado,
              c.nome_fantasia AS cliente_nome, c.nome AS cliente_razao,
              ci.nome AS cidade, ci.uf, m.nome AS meso,
              u.nome AS usuario, u.login AS usuario_login, u.email AS usuario_email
       ${fromBase}
       ${where}
       ORDER BY cal.created_at DESC LIMIT ${safeLimite} OFFSET ${safeOffset}`,
      params
    );

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total ${fromBase} ${where}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    res.json({ sucesso: true, dados: rows, total, page, limite, paginas: Math.ceil(total / limite) || 1 });
  } catch (err) { next(err); }
});

// GET /api/calculos/:id — detalhe completo (snapshot)
router.get('/calculos/:id', async (req, res, next) => {
  try {
    const usuarioId = parseInt(String(req.usuario?.id), 10);
    if (!Number.isFinite(usuarioId) || usuarioId < 1)
      return res.status(401).json({ sucesso: false, erro: 'Token inválido: usuário não identificado.' });
    const calcId = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(calcId))
      return res.status(400).json({ sucesso: false, erro: 'ID inválido.' });
    const [rows] = await db.query(
      'SELECT snapshot_json FROM calculos WHERE id = ? AND usuario_id = ?',
      [calcId, usuarioId]
    );
    if (!rows.length) return res.status(404).json({ sucesso: false, erro: 'Cálculo não encontrado.' });
    const snap = rows[0].snapshot_json;
    const dados = typeof snap === 'string' ? JSON.parse(snap) : snap;
    res.json({ sucesso: true, dados });
  } catch (err) { next(err); }
});

module.exports = router;
