# 🏫 CSP Gestão 2027 — Guia de Deploy

Sistema web completo para Coordenação Pedagógica do Colégio São Paulo.

---

## ✅ PASSO A PASSO PARA COLOCAR NO AR

### PASSO 1 — Criar conta no Supabase (banco de dados gratuito)

1. Acesse **https://supabase.com** e clique em "Start your project"
2. Crie uma conta (pode usar Google)
3. Clique em **"New project"**
4. Dê o nome: `csp-gestao-2027`
5. Defina uma senha forte para o banco
6. Escolha região: **South America (São Paulo)**
7. Aguarde ~2 minutos enquanto cria o projeto

### PASSO 2 — Configurar o banco de dados

1. No painel do Supabase, clique em **"SQL Editor"** (menu lateral, ícone de código)
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie TODO o conteúdo e cole no editor do Supabase
5. Clique em **"Run"** (botão verde)
6. Aguarde a mensagem "Success"

### PASSO 3 — Pegar as credenciais do Supabase

1. No Supabase, clique em ⚙️ **Settings** → **API**
2. Copie:
   - **Project URL** (começa com `https://`)
   - **anon public key** (texto longo)

### PASSO 4 — Criar conta no GitHub

1. Acesse **https://github.com** e crie uma conta gratuita
2. Clique em **"New repository"**
3. Nome: `csp-gestao-2027`
4. Deixe como **Public**
5. Clique em **"Create repository"**

### PASSO 5 — Enviar o código para o GitHub

Abra o terminal (PowerShell) na pasta do projeto e rode:

```powershell
# Na pasta c:\Users\Gustavo\Documents\Projeto-CSP
git init
git add .
git commit -m "Sistema CSP 2027 - versão inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/csp-gestao-2027.git
git push -u origin main
```

### PASSO 6 — Deploy no Vercel (site gratuito)

1. Acesse **https://vercel.com** e clique em "Sign up"
2. Escolha **"Continue with GitHub"** — conecta automaticamente
3. Clique em **"Add New Project"**
4. Selecione o repositório `csp-gestao-2027`
5. Clique em **"Import"**
6. Na tela de configuração, abra **"Environment Variables"** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon do Supabase
7. Clique em **"Deploy"**
8. Aguarde ~2 minutos
9. 🎉 **Seu site estará no ar!** Com um link tipo `csp-gestao-2027.vercel.app`

---

## 👤 CRIAR O PRIMEIRO USUÁRIO (COORDENADORA)

Após o deploy:
1. Acesse o Supabase → **Authentication** → **Users**
2. Clique em **"Invite user"**
3. Informe o e-mail da coordenadora
4. Em **"User metadata"** (clique em "Add metadata"), adicione:
   ```json
   { "nome": "Nome da Coordenadora", "role": "coordenadora" }
   ```
5. A coordenadora receberá um e-mail para definir a senha
6. Após o primeiro login, ela já terá acesso total ao sistema

### Adicionar outros usuários (professores, direção):
- Repita o processo no Supabase com o `"role"` correspondente: `"professor"` ou `"direcao"`
- Ou use a página **Equipe** dentro do sistema (apenas coordenadora tem acesso)

---

## 🔐 PAPÉIS DO SISTEMA

| Papel | Acesso |
|-------|--------|
| `coordenadora` | Acesso total: criar, editar, excluir tudo |
| `direcao` | Visualizar tudo + criar/editar eventos e reuniões |
| `professor` | Somente visualização do calendário e eventos |

---

## 📱 PÁGINAS DO SISTEMA

| Rota | Descrição |
|------|-----------|
| `/` | Login |
| `/dashboard` | Painel principal com resumo |
| `/calendario` | Calendário anual 2027 |
| `/eventos` | Gestão de eventos escolares |
| `/reunioes` | Registro de reuniões |
| `/projetos` | Projetos pedagógicos |
| `/checklist` | Checklist da coordenação |
| `/indicadores` | Dashboard de KPIs |
| `/equipe` | Gerenciar usuários (só coordenadora) |

---

## 🔧 DESENVOLVIMENTO LOCAL

```powershell
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

---

## 💡 DICAS

- **Domínio personalizado:** No Vercel, você pode adicionar um domínio próprio (ex: `gestao.colegiosaoPaulo.com.br`) em Project Settings → Domains
- **Atualizações:** Qualquer `git push` para o GitHub faz o Vercel atualizar o site automaticamente em ~1 minuto
- **Backup:** O Supabase tem backup automático diário no plano gratuito
- **Suporte:** O plano gratuito do Supabase suporta até 50.000 usuários e 500 MB de banco de dados — mais que suficiente para o CSP

---

*Sistema desenvolvido para o Colégio São Paulo — Coordenação Pedagógica 2027*
