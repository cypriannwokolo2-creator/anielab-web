# syntax=docker/dockerfile:1.7
#
# AnieLab web — Next.js frontend (port 3000).
#
# Same multi-stage shape as the backend: a full `npm ci` in the builder supplies
# the TypeScript / Tailwind toolchain that `next build` needs; the runner image
# carries production deps only (`npm ci --only=production`) + the compiled
# `.next` output. Lean, non-root, no devDeps shipped.

# ─── Stage 1: dependencies (full, incl. devDependencies) ───────────────
# next build compiles .tsx and needs typescript, @types/*, eslint-config-next,
# and @tailwindcss/postcss (all devDependencies). devDeps stay in this stage.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: builder ───────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars are inlined into the client bundle at BUILD time, not at
# runtime. deploy.sh sources .env and passes these as --build-arg; the VM
# .env must set them BEFORE the image is built. Without them the shipped
# client doesn't know its Supabase / backend / Stellar endpoints.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_STELLAR_NETWORK
ARG NEXT_PUBLIC_SOROBAN_RPC_URL
ARG NEXT_PUBLIC_USDC_SAC_TESTNET
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_MEDIA_BASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK
ENV NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL
ENV NEXT_PUBLIC_USDC_SAC_TESTNET=$NEXT_PUBLIC_USDC_SAC_TESTNET
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_MEDIA_BASE_URL=$NEXT_PUBLIC_MEDIA_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 3: runner (production deps only) ────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# next start reads PORT to choose the listen port; HOSTNAME=0.0.0.0 binds
# inside the container so Caddy can reach it from the host network.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the non-root `node` user (uid 1000) baked into the image — runbook
# item 48 (P0): containers must not run as root.
COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci --only=production && npm cache clean --force

# Runtime artifacts copied from the build stage.
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "start"]
