require('dotenv').config();
const path        = require('path');
const express     = require('express');
const cors        = require('cors');
const authRouter  = require('./routes/auth');
const freteRouter = require('./routes/frete');
const adminRouter = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Rotas específicas antes do prefixo genérico /api (caso contrário freteRouter captura tudo sob /api)
app.get('/api/health', (req, res) => {
  const skipLogin =
    process.env.SKIP_LOGIN === '1' ||
    process.env.SKIP_LOGIN === 'true' ||
    process.env.SKIP_LOGIN === 'yes';
  const payload = {
    sucesso: true,
    mensagem: 'API rodando!',
    hora: new Date().toLocaleString('pt-BR'),
    skipLogin,
  };
  if (skipLogin) {
    payload.skipLoginUserId = Number(process.env.SKIP_LOGIN_USER_ID || 1);
    payload.skipLoginNome = process.env.SKIP_LOGIN_NOME || 'Administrador';
    payload.skipLoginPerfil = process.env.SKIP_LOGIN_PERFIL === 'user' ? 'user' : 'admin';
  }
  res.json(payload);
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', freteRouter);

const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

app.use((err, req, res, next) => {
  console.error('[ERRO]', err.message);
  res.status(err.status || 500).json({ sucesso: false, erro: err.message || 'Erro interno.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nPortal Frete  ->  http://localhost:${PORT}`);
  console.log(`API health    ->  http://localhost:${PORT}/api/health`);
  if (
    process.env.SKIP_LOGIN === '1' ||
    process.env.SKIP_LOGIN === 'true' ||
    process.env.SKIP_LOGIN === 'yes'
  )
    console.warn('\n⚠  SKIP_LOGIN ativo — API sem verificação de JWT (só desenvolvimento).\n');
  else console.log('');
});
