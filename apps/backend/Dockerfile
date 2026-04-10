# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências globais e do monorepo
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/design-system/package.json ./packages/design-system/
COPY packages/types/package.json ./packages/types/

# Instala todas as dependências (necessário para buildar pacotes internos)
RUN npm install

# Copia o código fonte de todo o monorepo
COPY . .

# Builda o backend e suas dependências internas
RUN npm run build -w @carsena/backend

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/packages ./packages

EXPOSE 3000

# O script de deploy injeta o .env na raiz, então ele estará em /app/.env
CMD ["node", "apps/backend/dist/index.js"]
