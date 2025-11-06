.PHONY: help install install-bun install-backend install-ui setup-env dev dev-backend dev-ui clean

# Default target
help:
	@echo "Available targets:"
	@echo "  make install        - Install bun (if needed) and all dependencies (backend + UI)"
	@echo "  make install-bun    - Install bun runtime"
	@echo "  make install-backend - Install backend dependencies only"
	@echo "  make install-ui     - Install UI dependencies only"
	@echo "  make setup-env      - Copy env.example to .env (if env.example exists)"
	@echo "  make dev             - Start both backend and UI in development mode"
	@echo "  make dev-backend    - Start backend only"
	@echo "  make dev-ui         - Start UI only"
	@echo "  make clean          - Clean node_modules and lock files"

# Check if bun is installed
BUN := $(shell command -v bun 2> /dev/null)

# Install bun if not present
install-bun:
	@if [ -z "$(BUN)" ]; then \
		echo "Bun not found. Installing bun..."; \
		if command -v brew > /dev/null 2>&1; then \
			echo "Using Homebrew to install bun..."; \
			brew install oven-sh/bun/bun; \
		else \
			echo "Using curl to install bun..."; \
			curl -fsSL https://bun.sh/install | bash; \
		fi; \
		echo "Bun installed successfully!"; \
	else \
		echo "Bun is already installed at $(BUN)"; \
	fi

# Install backend dependencies
install-backend: install-bun
	@echo "Installing backend dependencies..."
	@bun install
	@echo "Backend dependencies installed!"

# Install UI dependencies
install-ui: install-bun
	@echo "Installing UI dependencies..."
	@cd ui && bun install
	@echo "UI dependencies installed!"

# Install all dependencies
install: install-bun install-backend install-ui
	@echo "All dependencies installed successfully!"

# Setup environment file
setup-env:
	@if [ -f env.example ]; then \
		if [ ! -f .env ]; then \
			cp env.example .env; \
			echo ".env file created from env.example"; \
		else \
			echo ".env file already exists, skipping..."; \
		fi; \
	else \
		echo "env.example not found, skipping..."; \
	fi

# Development targets
dev-backend:
	@echo "Starting backend server..."
	@bun run dev

dev-ui:
	@echo "Starting UI development server..."
	@cd ui && bun run dev

# Start both backend and UI (run in parallel)
dev: install setup-env
	@echo "Starting backend and UI..."
	@trap 'kill 0' EXIT; \
	bun run dev & \
	cd ui && bun run dev & \
	wait

# Clean targets
clean:
	@echo "Cleaning node_modules and lock files..."
	@rm -rf node_modules bun.lock
	@rm -rf ui/node_modules ui/bun.lock ui/package-lock.json
	@echo "Clean complete!"

