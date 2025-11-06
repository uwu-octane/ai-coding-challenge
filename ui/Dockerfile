FROM oven/bun:1.1 AS base

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

# Default Vite dev server port is configured to 7787 in vite.config.ts
EXPOSE 7787

# Forward the port and start dev server (suitable for compose usage)
ENV VITE_PORT=7787
CMD ["sh", "-c", "bun run dev -- --port ${VITE_PORT} --host 0.0.0.0"]


