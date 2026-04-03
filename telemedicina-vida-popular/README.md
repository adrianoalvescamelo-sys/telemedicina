# 🏥 Telemedicina — Clínica Vida Popular

Sistema completo de teleconsulta médica com IA diagnóstica, transcrição em tempo real e prontuário eletrônico.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Banco de dados | Neon PostgreSQL (serverless) |
| IA diagnóstica | Anthropic Claude (claude-opus-4-5) |
| Transcrição | OpenAI Whisper |
| Autenticação | JWT + cookie HTTP-only |
| Deploy | Vercel |

---

## 🚀 Deploy no Vercel (passo a passo)

### 1. Subir o código no GitHub

```bash
cd telemedicina-vida-popular
git init
git add .
git commit -m "feat: telemedicina vida popular v1"
git remote add origin https://github.com/SEU_USER/telemedicina-vida-popular.git
git push -u origin main
```

### 2. Criar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Clique em **Deploy** (vai falhar sem as env vars — normal)

### 3. Configurar variáveis de ambiente no Vercel

Em **Settings > Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_J2pdnDR8FqKS@ep-jolly-bar-am7mqil3.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | (gere com `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (console.anthropic.com) |
| `OPENAI_API_KEY` | `sk-...` (platform.openai.com) |

Depois clique em **Redeploy**.

### 4. Inicializar o banco de dados

Após o deploy, rode **uma única vez**:

```bash
curl -X POST https://SEU-APP.vercel.app/api/setup \
  -H "x-setup-secret: SEU_JWT_SECRET"
```

Resposta esperada:
```json
{
  "ok": true,
  "acesso": {
    "email": "ucirlana@vidapopular.com.br",
    "senha": "vidapopular2024"
  }
}
```

> ⚠️ **Troque a senha após o primeiro login!**

---

## 💻 Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis
cp .env.example .env.local
# Edite .env.local com seus valores

# 3. Criar tabelas no banco
npm run db:migrate

# 4. Iniciar servidor
npm run dev
# → http://localhost:3000
```

---

## 📁 Estrutura do projeto

```
app/
├── (auth)/
│   └── login/page.tsx          # Tela de login
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + navegação
│   ├── dashboard/page.tsx      # Dashboard com agenda do dia
│   ├── consultas/page.tsx      # Lista de consultas
│   ├── consulta/[id]/page.tsx  # Teleconsulta AO VIVO + IA
│   ├── prontuarios/page.tsx    # Busca de prontuários
│   ├── prontuario/[id]/page.tsx # Prontuário editável + copiar
│   ├── pacientes/page.tsx      # Cadastro e lista de pacientes
│   └── medicos/page.tsx        # Cadastro de médicos
├── api/
│   ├── ai/
│   │   ├── sugestoes/route.ts  # POST → sugestões Claude
│   │   └── stream/route.ts     # POST → streaming SSE
│   ├── transcricao/route.ts    # POST áudio → Whisper → texto
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── registro/route.ts
│   │   ├── logout/route.ts
│   │   └── me/route.ts
│   ├── pacientes/route.ts      # CRUD pacientes
│   ├── pacientes/[id]/route.ts
│   ├── consultas/route.ts      # CRUD consultas
│   ├── consultas/[id]/route.ts
│   ├── prontuarios/route.ts    # CRUD prontuários
│   └── setup/route.ts          # Inicializa banco (1x)
├── lib/
│   ├── db.ts                   # Neon SQL client
│   └── auth.ts                 # JWT helpers
└── types/index.ts              # TypeScript types
```

---

## 🤖 Fluxo da IA

```
Médico grava áudio (paciente ou médico)
        ↓
POST /api/transcricao  →  OpenAI Whisper  →  texto PT-BR
        ↓
Chunks salvos em tabela `transcricoes`
        ↓
A cada 4 chunks → POST /api/ai/sugestoes
        ↓
Claude analisa transcrição + histórico do paciente
        ↓
Retorna JSON: { sugestoes[], resumo_clinico, alertas_gerais }
        ↓
Exibido em tempo real no painel lateral da consulta
        ↓
Médico aceita sugestões → salvas no prontuário
```

---

## 🔒 Segurança

- Senhas com bcrypt (salt 12)
- JWT com expiração de 8h
- Cookie HTTP-only (não acessível por JS)
- Todas as rotas da API exigem autenticação
- Setup do banco protegido por JWT_SECRET
- Dados sensíveis nunca no frontend

---

## 📋 Roadmap futuro

- [ ] Videochamada real via LiveKit WebRTC
- [ ] Agendamento com calendário
- [ ] Receituário em PDF assinado digitalmente
- [ ] App mobile (React Native)
- [ ] Integração com CFM para validação de CRM
- [ ] Notificações WhatsApp para pacientes
