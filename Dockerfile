# Build stage — bun workspace (app + api)
FROM oven/bun:1 AS builder

WORKDIR /src

# Install workspace deps (root manifest + lockfile resolve both app and api)
COPY package.json bun.lock ./
COPY app/package.json ./app/package.json
COPY api/package.json ./api/package.json
RUN bun install --frozen-lockfile

# Build the Nuxt app
COPY . .
RUN bun run --filter './app' build

# Runtime stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /src/app/.output ./.output

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
