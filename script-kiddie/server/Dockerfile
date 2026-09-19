FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache vips

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/uploads/avatars \
    && chown -R appuser:appgroup /app/uploads
USER appuser

EXPOSE 4000
CMD ["node", "dist/server.js"]
