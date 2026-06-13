/**
 * Aplica migração login + corrige senha admin (admin123) no MySQL local.
 * Uso: node scripts/setup-login-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const HASH_ADMIN123 = '$2a$12$fTu.rhXMfEOjWSqj2nByeeOFpIyRuHKfuNxRTp3eW1m7mp/B8.75m';

async function colunaLoginExiste(conn) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'login'`,
    [process.env.DB_NAME || 'frete_portal']
  );
  return Number(rows[0].n) > 0;
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  if (!(await colunaLoginExiste(conn))) {
    console.log('Adicionando coluna usuarios.login…');
    await conn.execute(
      `ALTER TABLE usuarios ADD COLUMN login VARCHAR(80) NULL UNIQUE
       COMMENT 'Nome de usuário para entrar no portal' AFTER nome`
    );
    await conn.execute(
      `UPDATE usuarios SET login = 'fernando.alves'
       WHERE LOWER(TRIM(email)) IN ('fernandograupneralves@gmail.com', 'admin@drylock.com.br') AND login IS NULL`
    );
    await conn.execute(`UPDATE usuarios SET login = CONCAT('user_', id) WHERE login IS NULL`);
    await conn.execute(`ALTER TABLE usuarios MODIFY login VARCHAR(80) NOT NULL`);
    console.log('Migração login concluída.');
  } else {
    console.log('Coluna login já existe.');
  }

  const [r] = await conn.execute(
    `UPDATE usuarios SET senha_hash = ?, email = 'fernandograupneralves@gmail.com'
     WHERE login = 'fernando.alves' OR LOWER(TRIM(email)) IN ('admin@drylock.com.br', 'fernandograupneralves@gmail.com')`,
    [HASH_ADMIN123]
  );
  console.log('Senha admin123 e e-mail aplicados. Linhas:', r.affectedRows);

  await conn.end();
})().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
