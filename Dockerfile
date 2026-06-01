FROM node:24-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG APP_NAME
ARG APP_URL
ARG NEXT_PUBLIC_APP_URL
ARG NODE_ENV
ARG USE_FIFO_MOVEMENTS_ENGINE
ARG POSTGRES_HOST
ARG POSTGRES_PORT
ARG POSTGRES_DB
ARG SAAS_DB
ARG APP_DB
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG DATABASE_URL
ARG ADM_DATABASE_URL
ARG APP_DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG MONGODB_SERVER_IP
ARG MONGODB_USER
ARG MONGODB_USER_PASSWORD
ARG MONGODB_DATABASE
ARG MONGODB_URI
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "/app/scripts/healthcheck.js"]

CMD ["node", "server.js"]
