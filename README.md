# 🎓 Mackenzie Projects Hub

Dashboard moderno para gerenciar e visualizar todos os projetos acadêmicos do Mackenzie. Permite cadastrar projetos, vincular pastas físicas do disco, monitorar frequência de atualização com um sistema de **farol de cores** e filtrar projetos por período de atividade.

🌐 **Acesse o Site Online (Vercel)**: [https://projetos-mackenzie-github-juvs.vercel.app/](https://projetos-mackenzie-github-juvs.vercel.app/)

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- **Node.js** instalado (versão 14 ou superior)
  - Verifique se já tem: `node -v`
  - Baixe em: https://nodejs.org

> ⚠️ Não é necessário instalar nenhuma dependência (`npm install`). O servidor usa apenas módulos nativos do Node.js (`http`, `fs`, `path`).

---

### ▶️ Iniciando o servidor

1. Abra o terminal (PowerShell, CMD ou Git Bash)

2. Navegue até a pasta do projeto:
   ```bash
   cd C:\Users\minoru\Downloads\projetos_mackenzie_github
   ```

3. Inicie o servidor:
   ```bash
   node server.js
   ```

4. Você verá a mensagem de sucesso:
   ```
   ==================================================
    Mackenzie Projects Hub rodando com sucesso!
    URL de acesso: http://localhost:3000
    Banco de dados local: ...\projects.json
   ==================================================
   ```

5. Abra o navegador e acesse:
   ```
   http://localhost:3000
   ```

---

### 🛑 Parando o servidor

No terminal onde o servidor está rodando, pressione:
```
Ctrl + C
```

---

### ⚠️ Erro: porta 3000 em uso

Se aparecer `Error: listen EADDRINUSE :::3000`, significa que já existe um processo usando a porta. Para liberar:

**Windows (PowerShell):**
```powershell
# Encontra o processo que está usando a porta 3000
netstat -ano | findstr :3000

# Encerra o processo pelo PID encontrado (substitua pelo número real)
taskkill /PID <PID> /F

# Ou mata todos os processos Node.js de uma vez:
Stop-Process -Name node -Force
```

Depois inicie novamente com `node server.js`.

---

## 📁 Estrutura do projeto

```
projetos_mackenzie_github/
│
├── index.html          # Interface principal (SPA)
├── style.css           # Estilos (glassmorphism, dark mode)
├── app.js              # Lógica do frontend (filtros, cards, métricas)
├── server.js           # Servidor HTTP local (API REST + arquivos estáticos)
├── projects.json       # Banco de dados local (gerado automaticamente)
│
├── SITE_CAROMETRO/                         # Pasta física de projeto
├── SITE_CHATBOT_MACKENZIE_*/               # Pasta física de projeto
├── SITE_MACKENZIE_ACADEMIC_INTELLIGENCE/   # Pasta física de projeto
└── ...                                     # Demais pastas dos projetos
```

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📋 **Cadastro de projetos** | Nome, descrição, tecnologias, datas |
| 📂 **Pasta física vinculada** | Vincula projeto a uma pasta real do disco |
| 📅 **Datas automáticas** | Lê `birthtime` (criação) e `mtime` (última modificação) da pasta |
| 🚦 **Farol de recência** | 🔴 Recente (≤30 dias) · 🟡 Médio (31–180 dias) · 🟢 Antigo (>180 dias) |
| 📊 **Indicadores de frequência** | Contagem e % por categoria de farol, clicáveis como filtro |
| 🔍 **Busca e filtros** | Por nome, descrição, tecnologia e ordenação |
| 💾 **Persistência local** | Dados salvos em `projects.json` (sem banco de dados externo) |
| 🌐 **Modo offline** | Fallback para `localStorage` se o servidor não estiver rodando |

---

## 🎨 Tecnologias utilizadas

- **Frontend**: HTML5, CSS3 Vanilla, JavaScript (ES6+)
- **Backend**: Node.js (sem frameworks, apenas módulos nativos)
- **Ícones**: [Lucide Icons](https://lucide.dev)
- **Fontes**: [Google Fonts — Outfit & Inter](https://fonts.google.com)
- **Design**: Glassmorphism · Dark Mode · Micro-animações

---

## 🗂️ API do servidor

O servidor expõe uma API REST simples em `http://localhost:3000/api/projects`:

| Método | Rota | Ação |
|--------|------|------|
| `GET` | `/api/projects` | Lista todos os projetos (com datas reais das pastas) |
| `POST` | `/api/projects` | Cria um novo projeto |
| `PUT` | `/api/projects?id=...` | Atualiza um projeto existente |
| `DELETE` | `/api/projects?id=...` | Remove um projeto |

---

## 💡 Dicas de uso

- **Vincular uma pasta existente**: ao criar/editar um projeto, selecione "Vincular pasta existente" e escolha a pasta correspondente. As datas de criação e atualização serão lidas automaticamente do disco.
- **Filtrar pelo farol**: clique em qualquer indicador da barra de frequência (Mês / Semestre / Estáveis) para filtrar os cards da tela.
- **Remover filtro**: clique novamente no indicador ativo ou no botão "Limpar".

---

## 👨‍💻 Desenvolvimento e Supervisão

- **Desenvolvido para:** **Universidade Presbiteriana Mackenzie** — Hub de projetos acadêmicos pessoais.
- **Desenvolvedor:** [Minoru Yamanaka](https://linkedin.com/in/minoru-yamanaka) (Este painel funciona como um espelho demonstrativo do servidor local de desenvolvimento. Alterações permanentes na estrutura física e de banco de dados devem ser efetuadas localmente).
- **Supervisão:** [Guilherme Vergara](https://www.linkedin.com/in/guilherme-vergara) (Os projetos estão sob sua supervisão e as alterações devem ser aprovadas por ele).
