const db = require('../config/db');

/** Base criada antes da coluna usuarios.login — CREATE TABLE IF NOT EXISTS não atualiza a tabela. */
function erroColunaLoginAusente(err) {
  return (
    err.errno === 1054 ||
    String(err.sqlMessage || err.message || '').includes("Unknown column 'login'")
  );
}

/**
 * Login por usuário (login) ou e-mail; se a coluna login não existir, só e-mail funciona.
 */
async function buscarUsuarioPorCredencial(norm) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM usuarios
       WHERE (login = ? OR LOWER(TRIM(email)) = ?) AND ativo = 1
       LIMIT 1`,
      [norm, norm]
    );
    return { usuario: rows[0], modoLegadoSemColunaLogin: false };
  } catch (err) {
    if (!erroColunaLoginAusente(err)) throw err;
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = ? AND ativo = 1 LIMIT 1',
      [norm]
    );
    return { usuario: rows[0], modoLegadoSemColunaLogin: true };
  }
}

async function listarUsuariosParaAdmin() {
  try {
    const [rows] = await db.execute(
      'SELECT id,nome,login,email,perfil,ativo,created_at FROM usuarios ORDER BY nome'
    );
    return rows;
  } catch (err) {
    if (!erroColunaLoginAusente(err)) throw err;
    const [rows] = await db.execute(
      `SELECT id,nome,
              SUBSTRING_INDEX(LOWER(TRIM(email)),'@',1) AS login,
              email,perfil,ativo,created_at
       FROM usuarios ORDER BY nome`
    );
    return rows;
  }
}

module.exports = {
  erroColunaLoginAusente,
  buscarUsuarioPorCredencial,
  listarUsuariosParaAdmin,
};
