# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências globais e do monorepo
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/design-system/package.json ./packages/design-system/
COPY packages/types/package.json ./packages/types/

# Instala todas as dependências
RUN npm install

# Copia o código fonte
COPY . .

# Define argumentos de build (passados pelo docker-compose)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Builda o frontend
RUN npm run build -w @carsena/frontend

# Stage 2: Production
FROM nginx:alpine

# Copia os arquivos estáticos construídos
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copia a configuração do Nginx para suportar SPA (Vite/React Router)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
