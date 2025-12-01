# Dockerfile para Barbearia App (Backend + Frontend)

# Etapa 1: Build do Frontend React
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copiar arquivos do frontend
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Etapa 2: Preparar Backend + Frontend buildado
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema para SQLite
RUN apk add --no-cache python3 make g++

# Copiar arquivos do backend
COPY package*.json ./
RUN npm ci --only=production

# Copiar código do backend
COPY server.js ./
COPY routes/ ./routes/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY services/ ./services/
COPY database/init.js ./database/
COPY database/migrations/ ./database/migrations/

# Copiar frontend buildado
COPY --from=frontend-builder /app/client/dist ./client/dist

# Criar diretório para o banco de dados
RUN mkdir -p /data

# Expor porta
EXPOSE 8080

# Comando para iniciar
CMD ["node", "server.js"]


