# Guia de Integração Backend: Carsena

Este documento serve como a nova referência para a lógica de negócio e integrações da plataforma.

## 🔗 APIs & Serviços

### 1. Resend (E-mails)
**Variável**: `RESEND_API_KEY`
- **Regra**: Nunca enviar e-mails genéricos.
- **Estrutura**: Todos os templates devem usar o layout premium (HTML/CSS inline) com cores `#000000`, `#D4AF37` e fontes elegantes.
- **Fluxos**: 
  - Login (Código de Acesso).
  - Venda (Confirmação + QR Code).
  - Entrega (Link da Nuvem).

### 2. Cloudflare R2 (Storage)
- **Bucket**: `carsena-photo-assets`
- **Divisão**:
  - `original/`: Acesso restrito via Signed URLs.
  - `public/`: Thumbnails e assets da landing page com cache Edge.

### 3. Asaas (Pagamentos)
- **Modos**: Pix (Preferencial), Cartão e Boleto.
- **Webhooks**: Devem apontar para Supabase Edge Functions seguras.

## 🗄️ Database (Supabase)

### Schema: `app_carsena`
- **Isolamento**: Todas as tabelas residem aqui. Nunca usar o schema `public`.
- **Convenção**: `snake_case` para tabelas/colunas. `id uuid primary key default gen_random_uuid()`.

## 🚀 Fluxos de Trabalho (Workflows)

1. **Venda de Ingresso**:
   - Frontend dispara Checkout -> Asaas gera cobrança -> Webhook confirma pagamento -> Supabase cria Ticket -> Resend envia Código/QR Code.

2. **Entrega de Sessão**:
   - Admin faz Upload R2 -> Supabase registra metadados -> Resend notifica Cliente.
