# Multi-stage build for Cloud Run - node:*-slim (Debian/glibc), not alpine,
# because sharp's prebuilt native binaries don't reliably work on musl libc.
FROM node:22-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# next build's standalone tracing can miss sharp's native binary package -
# copy it explicitly from the builder (which installed it fresh for this
# same linux/x64 image, not whatever platform the build was triggered from).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

# The flat-file invite store (data/store.json) and uploaded photos
# (public/uploads) are written at runtime - Cloud Run's filesystem is
# ephemeral (wiped on every new revision/restart), which is a known,
# accepted limitation for this first deploy, not something this Dockerfile
# can fix on its own.
RUN mkdir -p data public/uploads && chown -R nextjs:nodejs data public/uploads

USER nextjs
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
