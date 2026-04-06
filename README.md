# Carsena - Plataforma Digital para Fotógrafos e Eventos

![Carsena Banner](https://raw.githubusercontent.com/cesarpsalves/carsena-photo/main/apps/frontend/public/og-image.jpg)

**Carsena** é uma solução completa e premium desenvolvida para transformar a forma como fotógrafos gerenciam seu trabalho, vendem fotos e organizam eventos. Com uma interface moderna (Glassmorphism), alta performance e integrações robustas, a plataforma oferece desde a gestão de álbuns privados até a venda de ingressos com checkout transparente.

---

## 🚀 Principais Funcionalidades

### 📸 Carsena Studio
- **Galerias Privadas:** Álbuns protegidos por senha para entrega de trabalhos.
- **Venda de Fotos:** Sistema de checkout integrado para download digital ou impressões.
- **Marca d'água Automática:** Proteção de imagem durante o processo de seleção do cliente.
- **Upload Inteligente:** Suporte a grandes volumes de mídia via Cloudflare R2.

### 🎫 Carsena Events & Tickets
- **Gestão de Ingressos:** Criação de lotes, cupons de desconto e controle de acesso.
- **Landing Pages:** Páginas personalizáveis para cada evento.
- **Check-in via QR Code:** Validação rápida na entrada do evento.

### 💰 Financeiro & Gestão
- **Dashboard de Vendas:** Visão clara de lucros, pedidos e estatísticas de tráfego.
- **Checkout Transparente:** Integração com Asaas para pagamentos via Pix, Cartão e Boleto.
- **Relatórios:** Exportação de dados financeiros e de clientes.

---

## 🛠️ Stack Tecnológica

O projeto utiliza o que há de mais moderno no ecossistema JavaScript/TypeScript:

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Node.js](https://nodejs.org/) + [Fastify](https://www.fastify.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Storage:** [Cloudflare R2](https://www.cloudflare.com/products/r2/) (compatível com S3)
- **Infraestrutura:** [Docker](https://www.docker.com/) & [Traefik](https://traefik.io/)
- **Pagamentos:** [Asaas API](https://www.asaas.com/)

---

## 📦 Como Rodar o Projeto

### Pré-requisitos
- Docker & Docker Compose
- Node.js 18+
- Arquivo `.env` configurado (veja `.env.example`)

### Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/cesarpsalves/carsena-photo.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Suba os containers:
   ```bash
   docker-compose up -d
   ```

A plataforma estará disponível em:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## 👨‍💻 Desenvolvedor

**Paulo Alves**
- [LinkedIn](https://www.linkedin.com/in/pauloalvesdev/)
- [GitHub](https://github.com/cesarpsalves)

---

## 📄 Licença

Este projeto é de uso privado e educacional. Todos os direitos reservados.# carsena
