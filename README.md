# NetSuite Error Library

Biblioteca de erros NetSuite para consultores — registre, busque e resolva erros de forma rápida e inteligente.

## 🚀 Deploy Rápido

**Deploy GRÁTIS em 5 minutos com Fly.io + Supabase:**

```bash
./scripts/deploy-setup.sh
```

Ou siga o [Quickstart de Deploy](QUICKSTART_DEPLOY.md)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS + Prisma |
| Frontend | Next.js 14 (App Router) |
| Banco | PostgreSQL |
| Cache | Redis |
| Busca | Meilisearch |
| OCR | Tesseract.js |
| IA | OpenAI API |

---

## Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para PostgreSQL, Redis e Meilisearch)

---

## Setup rápido

### 1. Subir infraestrutura (banco, cache, busca)

```bash
docker-compose up -d
```

Isso sobe:
- **PostgreSQL** em `localhost:5432`
- **Redis** em `localhost:6379`
- **Meilisearch** em `localhost:7700`

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed   # cria usuários demo + 5 erros de exemplo
npm run start:dev
```

Backend rodando em: `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend rodando em: `http://localhost:3000`

---

## Usuários demo (após seed)

| Usuário | Email | Senha | Role |
|---------|-------|-------|------|
| Admin | admin@netsuite.com | admin123 | ADMIN |
| Consultor | consultant@netsuite.com | consul123 | CONSULTANT |

---

## Variáveis de ambiente

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://netsuite:netsuite_pass@localhost:5432/netsuite_errors
REDIS_HOST=localhost
REDIS_PORT=6379
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=netsuite_meili_key
JWT_SECRET=netsuite-error-lib-secret-change-me
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-sua-chave-aqui     # opcional — habilita IA
UPLOAD_DIR=./uploads
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Funcionalidades

### Busca inteligente
- **Autocomplete em tempo real** enquanto digita
- **Busca fuzzy** (corrige erros de digitação) via Meilisearch
- **Busca semântica** via embeddings OpenAI (requer `OPENAI_API_KEY`)
- **Fallback para PostgreSQL** se Meilisearch não estiver disponível

### OCR automático
- Arraste um print de erro → texto extraído automaticamente com Tesseract.js
- Texto do OCR é indexado na busca

### IA (requer OpenAI)
- Sugestão automática de título, causa raiz, solução e tags
- Ativado quando `OPENAI_API_KEY` é configurado

### Registro rápido
- Upload de imagem → OCR → campos preenchidos automaticamente
- Só **título** e **solução** são obrigatórios
- Campos avançados (causa raiz, caminho NetSuite, como testar) são opcionais

---

## API Endpoints

### Auth
- `POST /auth/register` — Criar conta
- `POST /auth/login` — Login (retorna JWT)
- `GET /auth/profile` — Perfil do usuário logado

### Erros
- `POST /errors` — Criar erro *(autenticado)*
- `GET /errors` — Listar erros (paginado, com filtros)
- `GET /errors/:id` — Detalhe do erro
- `PUT /errors/:id` — Atualizar *(autor ou admin)*
- `DELETE /errors/:id` — Deletar *(autor ou admin)*

### Upload
- `POST /upload/image` — Upload de imagem + OCR automático *(autenticado)*

### Busca
- `GET /search?q=...` — Busca híbrida (Meilisearch + PostgreSQL + Semântica)
- `GET /search/autocomplete?q=...` — Autocomplete rápido (com cache Redis)

### IA
- `POST /ai/suggest` — Sugestões de título/causa/solução/tags *(autenticado)*

### Feedback
- `POST /errors/:id/feedback` — Votar se a solução funcionou *(autenticado)*
- `GET /errors/:id/feedback/stats` — Estatísticas de feedback

### Comentários
- `GET /errors/:id/comments` — Listar comentários
- `POST /errors/:id/comments` — Adicionar comentário *(autenticado)*
- `DELETE /errors/:id/comments/:commentId` — Deletar comentário próprio *(autenticado)*

### Tags
- `GET /tags` — Listar todas as tags
- `GET /tags/search?q=...` — Buscar tags
- `GET /tags/popular` — Tags mais usadas

---

## Estrutura do projeto

```
SearchNet/
├── docker-compose.yml       # PostgreSQL + Redis + Meilisearch
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Schema do banco
│   │   └── seed.ts          # Dados iniciais
│   └── src/
│       ├── modules/
│       │   ├── auth/        # JWT auth
│       │   ├── errors/      # CRUD de erros
│       │   ├── upload/      # Upload + OCR
│       │   ├── search/      # Busca híbrida
│       │   ├── ai/          # OpenAI embeddings + sugestões
│       │   ├── tags/        # Tags
│       │   ├── feedback/    # Feedback (funcionou/não funcionou)
│       │   ├── comments/    # Comentários
│       │   ├── redis/       # Cache
│       │   ├── meili/       # Meilisearch
│       │   └── prisma/      # Prisma service
│       └── common/
│           ├── decorators/  # @CurrentUser, @Roles
│           └── guards/      # RolesGuard
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Home (busca)
        │   ├── search/page.tsx       # Resultados de busca
        │   ├── errors/[id]/page.tsx  # Detalhe do erro
        │   ├── errors/new/page.tsx   # Cadastrar erro
        │   ├── login/page.tsx
        │   └── register/page.tsx
        ├── components/
        │   ├── SearchBar.tsx         # Barra de busca com autocomplete
        │   ├── ImageDropzone.tsx     # Drag & drop com OCR
        │   ├── Navbar.tsx
        │   └── SeverityBadge.tsx
        └── lib/
            ├── api.ts                # Cliente HTTP tipado
            └── auth-context.tsx      # Contexto de autenticação
```
