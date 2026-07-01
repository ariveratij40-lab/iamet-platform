# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Instalar todas las dependencias (dev + prod)
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Build del frontend (Vite) y backend (esbuild/tsc)
RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copiar manifiestos para instalar solo dependencias de producción
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

RUN pnpm install --frozen-lockfile --prod

# Copiar artefactos del build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
