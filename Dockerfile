# 1. 의존성 설치 및 빌드 스테이지
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. 프로덕션 실행 스테이지
FROM node:20-alpine AS runner
WORKDIR /app

# 빌드 스테이지에서 빌드된 결과물만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 포트 3000번 개방 및 서버 실행
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
