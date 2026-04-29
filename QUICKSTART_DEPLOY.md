# ⚡ Quick Start: Deploy em 5 minutos

## Passo 1: Supabase (2 min)

```bash
# Ir em: https://supabase.com/dashboard
# New Project → Region: São Paulo (sa-east-1)
# Copie a connection string no Settings > Database
```

**Sua connection string:**
```
postgresql://postgres:SEU_PASSWORD@SEU_HOST.supabase.co:5432/postgres
```

## Passo 2: Upstash Redis (1 min)

```bash
# Ir em: https://console.upstash.com
# New Database → Region: São Paulo
# Copie a Redis URL
```

**Sua Redis URL:**
```
redis://default:PASSWORD@HOST:35419
```

## Passo 3: Deploy (2 min)

### Opção A: Script automático

```bash
cd SearchNet
chmod +x scripts/deploy-setup.sh
./scripts/deploy-setup.sh

# Vai pedir:
# - Supabase Connection String
# - Redis URL
# - Nome do app Fly.io
# - URL do Frontend Vercel
# - JWT Secret (ou gera automático)
```

### Opção B: Manual

```bash
# 1. Instalar Fly.io CLI
npm install -g @flydotio/flyctl

# 2. Login
flyctl auth login

# 3. Criar app
flyctl apps create

# 4. Setar secrets
flyctl secrets set \
  DATABASE_URL="sua_supabase_url" \
  REDIS_HOST="seu_redis_host" \
  REDIS_PORT="35419" \
  JWT_SECRET="sua_chave_secreta" \
  FRONTEND_URL="seu_vercel_url" \
  PORT="3001"

# 5. Deploy
cd backend
flyctl deploy
```

## Passo 4: Frontend Vercel (1 min)

```bash
# 1. Push no GitHub
git add .
git commit -m "Add Fly.io config"
git push

# 2. Ir em vercel.com
# 3. New Project → Select your repo
# 4. Add environment variable:
# NEXT_PUBLIC_API_URL=https://seu-app-fly.fly.dev
# 5. Deploy
```

---

## ✅ Pronto!

- **Backend rodando:** https://seu-app-fly.fly.dev
- **Frontend rodando:** https://seu-projeto.vercel.app

**Testar:**
```bash
curl https://seu-app-fly.fly.dev/health
# {"status":"ok"}

# Ir em: https://seu-projeto.vercel.app
# Login: consultant@netsuite.com / consul123
```

---

## 🆘 Troubleshooting rápido

**Erro de connection no Supabase:**
```bash
# Verificar a URL:
psql "postgresql://postgres:SENHA@seu_host.supabase.co:5432/postgres" -c "SELECT 1;"
```

**Ver logs Fly.io:**
```bash
flyctl logs -n 100
```

**Forçar rebuild:**
```bash
flyctl deploy --force-build
```

---

## 💰 Custo

**$0 GRÁTIS FOREVER** ✅
