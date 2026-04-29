# 🚀 Deploy Fly.io + Supabase - Guia Completo

## ⚡ Resumo rápido

```bash
# 1. Setup Supabase (5 min)
# 2. Deploy Fly.io (5 min)
# 3. Pronto! Seu app rodando grátis
```

---

## 📋 Pré-requisitos

- Conta Fly.io (gratuita): https://fly.io
- Conta Supabase (gratuita): https://supabase.com
- CLI Fly.io instalada: `npm install -g @flydotio/flyctl`

---

## 1️⃣ Setup Supabase (banco de dados)

### A. Criar projeto Supabase

```bash
1. Ir em supabase.com/dashboard
2. Clique "New Project"
3. Database Password: guarde bem (você vai precisar)
4. Region: São Paulo (sa-east-1) para melhor latência
5. Aguarde 2-3 min até o banco estar pronto
```

### B. Pegar a connection string

```bash
1. No dashboard Supabase, clique no projeto
2. Vá para Settings > Database
3. Copy a "Connection string" (URL)
4. Deve ser tipo: postgresql://postgres:sua_senha@seu_host.supabase.co:5432/postgres
```

### C. Rodas migrations no Supabase

```bash
# No seu computador local:
cd backend

# Instale dotenv-cli:
npm install -D dotenv-cli

# Crie .env.supabase temporário:
echo "DATABASE_URL=postgresql://postgres:SENHA@seu_host.supabase.co:5432/postgres" > .env.supabase

# Rode as migrations:
dotenv -e .env.supabase npx prisma migrate deploy

# Seed com dados de exemplo:
dotenv -e .env.supabase npx prisma db seed
```

### D. Salve a connection string (vai precisar no Fly.io)

```
postgresql://postgres:SUA_SENHA@seu_host.supabase.co:5432/postgres
```

---

## 2️⃣ Setup Upstash Redis (cache)

### A. Criar Redis no Upstash

```bash
1. Ir em console.upstash.com
2. Clique "Create Database"
3. Name: netsuite-cache
4. Region: São Paulo (sa-east-1)
5. Type: Redis
6. Clique "Create"
```

### B. Pegar a URL

```bash
1. Clique no banco criado
2. Copy o "Redis URL"
3. Deve ser tipo: redis://default:senha@host:35419
```

---

## 3️⃣ Deploy Backend no Fly.io

### A. Login Fly.io

```bash
flyctl auth login
# Abre navegador, faz login com GitHub
```

### B. Criar app no Fly.io

```bash
cd backend

# Cria o app (escolha nome único):
flyctl apps create

# Exemplo:
# ? App Name: netsuite-error-library
# ? Region: gig (São Paulo)
```

### C. Setar variáveis de ambiente

```bash
# Substitua pelos valores do seu Supabase e Upstash:

flyctl secrets set \
  DATABASE_URL="postgresql://postgres:SENHA@seu_host.supabase.co:5432/postgres" \
  REDIS_HOST="seu_host_upstash" \
  REDIS_PORT="35419" \
  MEILI_HOST="http://localhost:7700" \
  MEILI_API_KEY="dev-key" \
  JWT_SECRET="sua-chave-super-secreta-aqui" \
  OPENAI_API_KEY="sk-sua-chave-opcional" \
  FRONTEND_URL="https://seu-frontend-vercel.vercel.app" \
  PORT="3001"
```

### D. Deploy

```bash
flyctl deploy

# Vai fazer build da imagem Docker e fazer deploy
# Espere ~2-3 minutos
```

### E. Verificar se tá rodando

```bash
# Ver logs:
flyctl logs

# Testar a API:
curl https://seu-app-name.fly.dev/health

# Deve retornar:
# {"status":"ok","timestamp":"2026-04-29T..."}
```

---

## 4️⃣ Deploy Frontend no Vercel

### A. Push no GitHub

```bash
cd SearchNet
git add .
git commit -m "Add Fly.io config"
git push origin main
```

### B. Deploy no Vercel

```bash
1. Ir em vercel.com
2. Clique "Add New Project"
3. Selecione seu repositório GitHub
4. Framework: Next.js (detecta automático)
5. Em "Environment Variables", adicione:

NEXT_PUBLIC_API_URL=https://seu-app-name.fly.dev

6. Clique "Deploy"
```

### C. Pronto! 🎉

Seu frontend estará em: `https://seu-projeto.vercel.app`

---

## 5️⃣ Variáveis de Ambiente Finais

### Backend (Fly.io)

```env
# Banco
DATABASE_URL=postgresql://postgres:SENHA@seu_host.supabase.co:5432/postgres

# Cache
REDIS_HOST=seu_host_upstash
REDIS_PORT=35419

# Busca (Meilisearch)
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=dev-key

# JWT
JWT_SECRET=sua-chave-secreta-bem-longa-aqui
JWT_EXPIRES_IN=7d

# OpenAI (opcional - deixe vazio se não tem)
OPENAI_API_KEY=sk-...

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# URLs
PORT=3001
FRONTEND_URL=https://seu-projeto.vercel.app
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://seu-app-name.fly.dev
```

---

## 🧪 Testar a aplicação

```bash
1. Abra: https://seu-projeto.vercel.app
2. Faça login com:
   Email: consultant@netsuite.com
   Senha: consul123

3. Teste:
   ✅ Buscar erro
   ✅ Criar novo erro
   ✅ Upload de imagem (OCR)
   ✅ Feedback
```

---

## 🚨 Troubleshooting

### "Connection refused" no Supabase

```bash
# Verificar se a connection string está correta:
psql "postgresql://postgres:SENHA@seu_host.supabase.co:5432/postgres"
```

### Logs do Fly.io mostram erro de banco

```bash
# Ver logs detalhados:
flyctl logs -n 100

# Redeployar:
flyctl deploy --force-build
```

### Frontend não conecta com backend

```bash
# Verificar se NEXT_PUBLIC_API_URL está correto em Vercel
# Deve ser: https://seu-app-fly.fly.dev

# Forçar rebuild no Vercel:
1. Vá no dashboard Vercel
2. Deployment settings > Redeploy
```

---

## 💰 Custo total mensal

| Serviço | Plano | Custo |
|---------|-------|-------|
| Fly.io (Backend) | Always Free | $0 |
| Supabase (Banco) | Free | $0 |
| Upstash (Redis) | Free | $0 |
| Vercel (Frontend) | Hobby | $0 |
| Meilisearch Cloud | Free | $0 |
| **TOTAL** | | **$0** |

---

## 📚 Links úteis

- Fly.io Docs: https://fly.io/docs
- Supabase Docs: https://supabase.com/docs
- Upstash Console: https://console.upstash.com
- Vercel Dashboard: https://vercel.com/dashboard

---

## ✅ Checklist de deployment

- [ ] Supabase criado e migrations rodadas
- [ ] Upstash Redis criado
- [ ] Fly.io CLI instalada e logada
- [ ] Backend deploying no Fly.io com sucesso
- [ ] Frontend deploying no Vercel com sucesso
- [ ] Health check passando: `/health`
- [ ] Login funcionando
- [ ] Busca funcionando
- [ ] Upload de imagem funcionando
- [ ] Feedback funcionando

---

## 🎉 Pronto!

Seu app está 100% online e GRÁTIS!

Compartilhe o link: `https://seu-projeto.vercel.app`
