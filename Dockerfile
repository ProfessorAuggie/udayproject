# Build client + server, run API and serve SPA
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN cd server && npm install
RUN cd client && npm install

COPY server ./server
COPY client ./client

RUN cd server && npx prisma generate
RUN cd client && npm run build
RUN cd server && npm run build

FROM node:22-bookworm-slim
WORKDIR /app/server

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/client/dist ../client/dist

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
