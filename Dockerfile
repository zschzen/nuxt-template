# Stage 1: Base & Build
FROM node:24-slim AS builder

# Set working directory
WORKDIR /app

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy workspace configuration and locks
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy packages and apps structures (only package.json first for better caching)
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the web application
RUN pnpm --filter @openpencil/web run build

# Stage 2: Runner
FROM node:24-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the output from the builder stage
COPY --from=builder /app/apps/web/.output ./output

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "output/server/index.mjs"]
