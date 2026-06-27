# Portal Frete

Sistema web para cálculo de espelho de frete (CIF/FOB), histórico de operações e painel administrativo de tarifas, pedágios, clientes e usuários.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 18+ |
| API | Express 4, REST JSON |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Banco | MySQL 8 (`mysql2`, pool) |
| Front | HTML/CSS/JS modular, React 18 via CDN (`login.html` + `app.html`) |
| PDF | jsPDF (client-side) |

## Arquitetura

Monólito leve: um processo Express serve o front estático e a API em `/api`. Regras de negócio do frete em `backend/services/freteService.js` (tarifa por messorregião/faixa de m³, ad valorem, pedágio, paletização, dedicado, ICMS por dentro). Cada cálculo persiste snapshot JSON em `calculos`.

```
frontend/index.html  →  redireciona para login ou app
frontend/login.html  →  tela de login (leve, sem código do app)
frontend/app.html    →  calculadora, histórico, admin
frontend/js/         →  módulos (utils, componentes, pdf…)
frontend/css/        →  estilos (base, login, app)
backend/             →  API, middlewares, services
database/            →  schema.sql, migrações
docs/previews/       →  mock estático da interface (sem backend)
```

## API (principais rotas)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/api/auth/login` | — |
| GET | `/api/health` | — |
| GET | `/api/clientes`, `/api/cidades` | JWT |
| POST | `/api/calcular` | JWT |
| GET | `/api/calculos`, `/api/calculos/:id` | JWT |
| CRUD | `/api/admin/*` (tarifas, clientes, usuários, pedágios, ICMS) | JWT + admin |

Resposta padrão: `{ sucesso, dados?, erro? }`.

## Banco (`frete_portal`)

`usuarios`, `messorregioes`, `cidades`, `clientes`, `tarifas`, `pedagios`, `icms_uf`, `calculos` (histórico + `snapshot_json`).

## Execução rápida

```bash
docker compose up -d          # MySQL + schema (opcional)
cd backend && copy .env.example .env   # ajustar DB_* e JWT_SECRET
npm install && npm run dev
```

App: `http://localhost:3001` · Health: `/api/health`

**Seed:** `fernando.alves` / `admin123` · Detalhes de importação do schema: `database/README.md`

## Variáveis (`backend/.env`)

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `PORT`, `SKIP_LOGIN` (dev: `0` = exige login).
