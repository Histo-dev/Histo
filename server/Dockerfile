FROM node:20-alpine AS base
RUN npm install -g pnpm@10.6.4
WORKDIR /app

# === Dependencies 단계 ===
FROM base AS dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile

# === Builder 단계 ===
FROM dependencies AS builder
COPY . .
RUN pnpm run build

# === Production Dependencies ===
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile --prod

# === Production 이미지 ===
FROM base AS production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/src/main"]