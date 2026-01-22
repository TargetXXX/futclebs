<div align="center">

# ⚽ FutClebs

**Classificação • Votação • Ranking • Comunidade**

Uma plataforma moderna para criar partidas, votar em resultados e acompanhar rankings em tempo real — tudo com uma experiência **mobile-first**, visual escuro e identidade futebolística.

<br/>

<img src="./assets/banner.png" alt="FutClebs Dashboard" width="100%" />

<br/>

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-10B981)
![Mobile First](https://img.shields.io/badge/mobile-first-020617)
![License](https://img.shields.io/badge/license-MIT-10B981)

</div>

---

## 🧠 Sobre o Projeto

O **FutClebs** nasceu com a ideia de ser um **hub comunitário de partidas e rankings**, onde usuários podem:

- Criar partidas ⚽  
- Votar em resultados 📊  
- Acompanhar histórico 📜  
- Subir no ranking 🏆  

Tudo isso com foco em **simplicidade**, **rapidez** e uma interface inspirada em produtos modernos de futebol.

---

## 🎨 Identidade Visual

- 🌑 **Tema Dark**
- 🟢 Verde principal: `#10B981`
- ⚫ Fundo base: `#020617`
- 📱 **Mobile First**
- ✨ UI limpa, fluida e minimalista

Inspirado em dashboards esportivos modernos.

---

## 🚀 Funcionalidades

### 👤 Usuário
- Login com sessão persistente
- Nível do jogador (OVR)
- Histórico de partidas
- Ranking global

### ⚽ Partidas
- Criar partidas
- Visualizar partidas abertas
- Sistema de votação
- Encerramento automático

### 🏆 Ranking
- Ranking geral
- Evolução por desempenho
- Histórico de votos

### 🛠 Admin
- Modo administrador
- Criação e gerenciamento de partidas
- Controle de categorias

---

## 🧩 Tecnologias Utilizadas

- **Frontend**
  - React / Next.js
  - Tailwind CSS
  - TypeScript

- **Backend / Infra**
  - Supabase (Auth + Database)
  - PostgreSQL
  - Row Level Security (RLS)

- **UX/UI**
  - Mobile First
  - Dark UI
  - Componentização moderna

---

## 📂 Estrutura do Projeto

```bash
src/
├── app/
│   ├── dashboard/
│   ├── auth/
│   └── ranking/
├── components/
├── hooks/
├── services/
│   └── supabase.ts
├── styles/
└── types/
