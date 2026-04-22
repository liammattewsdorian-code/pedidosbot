FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY prisma ./prisma
COPY bot/package*.json ./
RUN npm ci --omit=dev

# En Docker /app es la raíz; ajustar output del generator client_bot
RUN sed -i 's|../bot/node_modules/.prisma/client|../node_modules/.prisma/client|g' ./prisma/schema.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY bot/src ./src

EXPOSE 3010
CMD ["node", "src/index.js"]
