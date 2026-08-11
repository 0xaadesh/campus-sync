# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base - shared by every stage so the layer is downloaded and cached once.
# Prisma's query engine is a native binary that needs OpenSSL, and musl needs
# the glibc shim to load it.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app


# ---------------------------------------------------------------------------
# Dependencies - isolated so it only re-runs when the lockfile changes.
# The schema has to be here too: package.json's postinstall hook runs
# `prisma generate`, which reads prisma/schema.prisma.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci


# ---------------------------------------------------------------------------
# Build - produces .next/standalone, a traced bundle holding only the files
# the app actually imports at runtime.
# ---------------------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# ---------------------------------------------------------------------------
# Runtime - carries no package manager, no toolchain and no dev dependencies.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# Standalone bundles its own minimal node_modules and server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma CLI, engines and migrations, so the container can migrate on startup
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

# Documentation only - the published port is decided in docker-compose.yml.
# Nothing else can collide with 3000 inside this container.
EXPOSE 3000

# Apply pending migrations, then serve. A failed migration stops the boot
# rather than leaving the app running against a stale schema.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
