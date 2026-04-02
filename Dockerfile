FROM node:20-bookworm-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# Copy the whole Nx monorepo so apps/api and libs/* are available
COPY . .

# Install full workspace deps for build + Prisma CLI + Nx
RUN npm install --frozen-lockfile

# Generate Prisma Client before building
RUN npm exec prisma generate

# Build only the backend app
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# Apply migrations in production, then start the built API
CMD ["sh", "-c", "npm exec prisma migrate deploy && npm run start"]