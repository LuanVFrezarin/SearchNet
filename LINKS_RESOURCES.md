# 🔗 Links e Recursos

## 📌 Seu Repositório

```
https://github.com/LuanVFrezarin/SearchNet.git
```

---

## 🌐 Criar Contas (Gratuitas)

| Serviço | Link | O que é |
|---------|------|--------|
| **Supabase** | https://supabase.com/dashboard | PostgreSQL gerenciado |
| **Upstash** | https://console.upstash.com | Redis na nuvem |
| **Fly.io** | https://fly.io | Deploy de backend |
| **Vercel** | https://vercel.com/dashboard | Deploy de frontend |
| **Meilisearch Cloud** | https://cloud.meilisearch.com | Busca rápida |

---

## 📚 Documentação

| Recurso | Link |
|---------|------|
| Fly.io Docs | https://fly.io/docs |
| Supabase Docs | https://supabase.com/docs |
| Next.js Docs | https://nextjs.org/docs |
| NestJS Docs | https://docs.nestjs.com |
| Prisma Docs | https://www.prisma.io/docs |

---

## 🚀 Quick Commands

```bash
# Frontend local
cd frontend && npm run dev
# http://localhost:3000

# Backend local (precisa Docker)
cd backend && npm run start:dev
# http://localhost:3001

# Seed banco local
cd backend && npx prisma db seed

# Ver logs Fly.io
flyctl logs -a seu-app-name

# SSH no Fly.io
flyctl ssh console -a seu-app-name

# Redeployar
flyctl deploy -a seu-app-name --force-build
```

---

## 💡 Tips

### Aumentar memória no Fly.io (se needed)

```bash
flyctl scale memory 1024 -a seu-app-name
```

### Adicionar mais regiões

```bash
flyctl regions add gig # Add São Paulo replica
```

### Backup do banco Supabase

```
No dashboard Supabase:
Settings → Backups → Download backup
```

### Monitorar custos

- Fly.io: https://fly.io/dashboard/billing
- Supabase: Dashboard → Billing
- Upstash: https://console.upstash.com/billing

---

## 🆘 Support

**Problemas com deploy?**

1. Ver logs: `flyctl logs -a seu-app-name`
2. Verificar health: `curl https://seu-app.fly.dev/health`
3. Testar banco local: `npx prisma studio`

**Comunidades:**
- Fly.io Community: https://community.fly.io
- NestJS Discord: https://discord.gg/nestjs
- Next.js Discussions: https://github.com/vercel/next.js/discussions

---

## ✅ Checklist Final

- [ ] Fork/Clone do repositório
- [ ] Conta Supabase criada
- [ ] Conta Upstash criada
- [ ] Conta Fly.io criada
- [ ] Conta Vercel criada
- [ ] Migrations rodadas no Supabase
- [ ] Backend deploying no Fly.io
- [ ] Frontend deploying no Vercel
- [ ] Health check: `/health` respondendo
- [ ] Login funcionando
- [ ] App online em produção! 🎉
