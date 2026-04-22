FROM node:20-alpine

WORKDIR /app

# Copiar schema de prisma (está un nivel arriba en el repo)
COPY prisma ./prisma

# Copiar archivos del bot
COPY bot/package*.json ./
RUN npm ci --omit=dev

# Generar Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY bot/src ./src

EXPOSE 3010

CMD ["node", "src/index.js"]
