FROM node:22-alpine AS builder
RUN npm install -g pnpm@10.4.1
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile
COPY . .
ENV VITE_APP_URL=https://staging.iamet.mx
RUN pnpm build

FROM node:22-alpine
RUN npm install -g pnpm@10.4.1
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/deployment/vps-v2/schema.sql ./deployment/vps-v2/schema.sql
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /app/var/google-ads && chown -R nodejs:nodejs /app/var && chmod 700 /app/var/google-ads
USER nodejs
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
