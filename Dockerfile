FROM oven/bun:1.1 as base

WORKDIR /app

# Copy package.json first for dependency installation
COPY package.json ./

# Install dependencies (Bun can run TypeScript directly, so we may need dev deps)
RUN bun install

# Copy the rest of the server source
COPY src ./src
COPY tsconfig.json ./

EXPOSE 7788
RUN mkdir -p /app/data
ENV DB_FILE=/app/data/data.sqlite

CMD ["bun", "run", "src/index.ts"]


