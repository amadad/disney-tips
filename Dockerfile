# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist/ dist/
COPY server/ server/
COPY shared/ shared/
COPY tsconfig.json tsconfig.base.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["npx", "tsx", "server/index.ts"]
