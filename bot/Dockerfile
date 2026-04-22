FROM node:20-alpine

WORKDIR /app

# Copiar schema de Prisma (en el repo está un nivel arriba)
COPY prisma ./prisma

# Copiar archivos del bot e instalar dependencias
COPY bot/package*.json ./
RUN npm ci --omit=dev

# En Docker todo está en /app — el generator client_bot espera ../bot/node_modules/.prisma/client
# desde /app/prisma/ eso sería /app/bot/node_modules/.prisma/client
# Ajustamos el output a ../node_modules/.prisma/client (= /app/node_modules/.prisma/client)
RUN sed -i \
    's|../bot/node_modules/.prisma/client|../node_modules/.prisma/client|g' \
    ./prisma/schema.prisma && \
    npx prisma generate --schema=./prisma/schema.prisma

# Copiar código fuente
COPY bot/src ./src

EXPOSE 3010

CMD ["node", "src/index.js"]
