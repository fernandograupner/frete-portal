require('dotenv').config();
const mysql = require('mysql2/promise');

const HASH = '$2a$12$fTu.rhXMfEOjWSqj2nByeeOFpIyRuHKfuNxRTp3eW1m7mp/B8.75m';

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  const [r] = await c.execute(
    `UPDATE usuarios SET senha_hash = ?, email = 'fernandograupneralves@gmail.com'
     WHERE login = 'fernando.alves' OR LOWER(TRIM(email)) IN ('admin@drylock.com.br', 'fernandograupneralves@gmail.com')`,
    [HASH]
  );
  console.log('Senha admin atualizada. Linhas:', r.affectedRows);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
