FROM node:20-alpine AS base
RUN npm install -g pnpm@10.6.4
WORKDIR /app

# === Dependencies 단계 ===
FROM base AS dependencies
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile

# tfjs-node 네이티브 모듈 rebuild
RUN pnpm rebuild @tensorflow/tfjs-node --build-addon-from-source

# === Builder 단계 ===
FROM dependencies AS builder
COPY . .
RUN pnpm run build

# === Production Dependencies ===
FROM base AS prod-deps
# ⭐ 여기가 중요! g++이 필요함
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile --prod

# tfjs-node 네이티브 모듈 rebuild (프로덕션에서도!)
RUN pnpm rebuild @tensorflow/tfjs-node --build-addon-from-source

# === Production 이미지 ===
FROM base AS production
# ⭐ 런타임에도 필요한 라이브러리 설치
RUN apk add --no-cache libstdc++ libgomp

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main"]