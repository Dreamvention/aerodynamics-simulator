# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY spaces/web/package*.json ./

RUN npm ci

COPY spaces/web/ ./

RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output .output

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
