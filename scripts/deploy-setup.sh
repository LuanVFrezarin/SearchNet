#!/bin/bash

# Setup script para deploy Fly.io + Supabase
# Uso: ./scripts/deploy-setup.sh

set -e

echo "🚀 NetSuite Error Library - Setup de Deploy"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar pré-requisitos
echo -e "${YELLOW}📋 Verificando pré-requisitos...${NC}"

if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ Fly.io CLI não está instalada${NC}"
    echo "Instale com: npm install -g @flydotio/flyctl"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos OK${NC}"
echo ""

# Pedir informações do usuário
echo -e "${YELLOW}📝 Informações necessárias:${NC}"
echo ""

read -p "Supabase Connection String (postgresql://...): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Connection string não pode estar vazia${NC}"
    exit 1
fi

read -p "Upstash Redis URL (redis://...): " REDIS_URL
if [ -z "$REDIS_URL" ]; then
    echo -e "${RED}❌ Redis URL não pode estar vazia${NC}"
    exit 1
fi

read -p "Nome do app Fly.io (ex: netsuite-error-library): " FLY_APP_NAME
if [ -z "$FLY_APP_NAME" ]; then
    echo -e "${RED}❌ Nome do app não pode estar vazio${NC}"
    exit 1
fi

read -p "URL do Frontend Vercel (ex: https://seu-projeto.vercel.app): " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Frontend URL não pode estar vazia${NC}"
    exit 1
fi

read -s -p "JWT Secret (pressione Enter para gerar aleatório): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo ""
    echo -e "${GREEN}JWT Secret gerado: $JWT_SECRET${NC}"
fi

echo ""

# Extrair credenciais do Redis
IFS='://' read -r redis_protocol redis_rest <<< "$REDIS_URL"
IFS='@' read -r redis_creds redis_host_port <<< "$redis_rest"
IFS=':' read -r redis_user redis_password <<< "$redis_creds"
IFS=':' read -r redis_host redis_port <<< "$redis_host_port"

echo ""
echo -e "${YELLOW}🚀 Deploying...${NC}"
echo ""

# Fazer login Fly.io se não estiver logado
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Faça login no Fly.io:${NC}"
    flyctl auth login
fi

# Criar app Fly.io
echo -e "${YELLOW}Criando app no Fly.io...${NC}"
if ! flyctl apps list | grep -q "$FLY_APP_NAME"; then
    flyctl apps create "$FLY_APP_NAME" --region gig || true
fi

# Setar secrets
echo -e "${YELLOW}Configurando secrets no Fly.io...${NC}"
flyctl secrets set \
    -a "$FLY_APP_NAME" \
    DATABASE_URL="$SUPABASE_URL" \
    REDIS_HOST="$redis_host" \
    REDIS_PORT="$redis_port" \
    JWT_SECRET="$JWT_SECRET" \
    FRONTEND_URL="$FRONTEND_URL" \
    PORT="3001" \
    MEILI_HOST="http://localhost:7700" \
    MEILI_API_KEY="dev-key" \
    OPENAI_API_KEY="" \
    UPLOAD_DIR="./uploads"

echo -e "${GREEN}✅ Secrets configurados${NC}"
echo ""

# Deploy
echo -e "${YELLOW}Fazendo deploy...${NC}"
cd backend
flyctl deploy -a "$FLY_APP_NAME"

echo ""
echo -e "${GREEN}✅ Deploy completo!${NC}"
echo ""
echo "URL da API: https://${FLY_APP_NAME}.fly.dev"
echo ""
echo "Próximos passos:"
echo "1. Atualizar NEXT_PUBLIC_API_URL no Vercel para: https://${FLY_APP_NAME}.fly.dev"
echo "2. Fazer deploy do frontend no Vercel"
echo "3. Testar em: https://seu-frontend.vercel.app"
echo ""
echo "Ver logs: flyctl logs -a $FLY_APP_NAME"
