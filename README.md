# Portal Frete · Espelho de Frete

API Node.js (Express) + frontend estático (`frontend/index.html`). O servidor entrega o site e expõe a API sob `/api`.

## Ver só a interface (para revisão rápida)

Sem Node/MySQL: abra no navegador o arquivo estático **`docs/previews/interface-demo.html`** (mockups com dados fictícios — mesmo tema visual do portal).  
Instruções curtas em **`docs/previews/README.md`**.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- MySQL 8.x (com usuário/senha e base criadas)

## 1. Banco de dados

**Windows PowerShell não aceita `mysql … < arquivo.sql`** (erro “Operador '<' reservado”). Veja comandos que funcionam em **`database/README.md`**.

Ou suba MySQL já com o schema usando Docker, na raiz do projeto:

```bash
docker compose up -d
```

No `backend/.env` use então `DB_PASS=freteportal` e `DB_USER=root`, `DB_HOST=127.0.0.1`, `DB_NAME=frete_portal`.

Sem Docker, importação manual:

```bash
mysql -u root -p < database/schema.sql
```

(no terminal **CMD**, ou no PowerShell use o comando com `Get-Content` descrito em `database/README.md`).

Credenciais do **Portal** após importar `schema.sql`: usuário **`fernando.alves`** e senha **`admin123`** (ou e-mail **`fernandograupneralves@gmail.com`** em bases sem coluna `login` — ver `database/migration_usuario_login.sql`).

## 2. Configuração da API

```bash
cd backend
copy .env.example .env
```

Edite **`.env`**: `DB_*`, `JWT_SECRET`. Para servir frontend e API no mesmo host, use por exemplo:

```env
FRONTEND_URL=http://localhost:3001
PORT=3001
SKIP_LOGIN=0
```

## 3. Instalar e rodar

```bash
cd backend
npm install
npm start
```

Abra **http://localhost:3001** (ou a porta definida em `PORT`). Saúde da API: **http://localhost:3001/api/health**.

Em desenvolvimento com recarga automática: `npm run dev` (nodemon).

## Abrir só o arquivo HTML

Se preferir abrir `frontend/index.html` direto no navegador, o script usa automaticamente **http://localhost:3001/api** para as chamadas (é preciso que a API esteja rodando).
