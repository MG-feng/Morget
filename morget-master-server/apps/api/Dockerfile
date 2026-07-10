FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/ 2>/dev/null || true

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @morget/api... 2>/dev/null || pnpm install --filter @morget/api...

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter @morget/api prisma generate

# Build
RUN pnpm --filter @morget/api build

# Expose port
EXPOSE 3001

# Start server
CMD ["pnpm", "--filter", "@morget/api", "start"]
