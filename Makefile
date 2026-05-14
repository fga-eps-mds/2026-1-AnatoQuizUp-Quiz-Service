# AnatoQuizUp Quiz-Service — Makefile
#
# Uso: rode `make help` para ver todos os comandos.
# No Windows, instale o GNU Make antes:
#   choco install make    (Chocolatey)
#   scoop install make    (Scoop)
# Ou rode os equivalentes em `npm run ...` listados no README.

SHELL := /bin/sh
.DEFAULT_GOAL := help

# ============================================================================
#  Ajuda
# ============================================================================

.PHONY: help
help: ## Lista todos os comandos disponiveis
	@echo ""
	@echo "AnatoQuizUp Quiz-Service - comandos disponiveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
#  Setup e dependencias
# ============================================================================

.PHONY: setup
setup: ## Setup completo: copia .env, instala deps, sobe DB, gera prisma e roda seed
	@if [ ! -f .env ]; then cp .env.example .env && echo "[setup] .env criado. PREENCHA antes de continuar."; exit 1; fi
	npm ci
	$(MAKE) db-up
	@echo "[setup] aguardando 5s para o Postgres terminar de inicializar..."
	@sleep 5
	$(MAKE) prisma-all

.PHONY: install
install: ## npm ci
	npm ci

# ============================================================================
#  Desenvolvimento
# ============================================================================

.PHONY: dev
dev: ## Sobe a Quiz-Service em watch mode (porta 3334)
	npm run dev

.PHONY: build
build: ## Compila TypeScript para dist/
	npm run build

.PHONY: start
start: ## Roda a build (uso de producao)
	npm start

# ============================================================================
#  Qualidade
# ============================================================================

.PHONY: lint
lint: ## ESLint
	npm run lint

.PHONY: format
format: ## Prettier --write
	npm run format

.PHONY: test
test: ## Testes Jest
	npm test

.PHONY: test-ci
test-ci: ## Testes com cobertura (gate 85%)
	npm test -- --coverage --runInBand

# ============================================================================
#  Banco de dados
# ============================================================================

.PHONY: db-up
db-up: ## Sobe o Postgres via Docker Compose
	docker compose up -d db

.PHONY: db-down
db-down: ## Para o Postgres (mantem volume)
	docker compose down

.PHONY: db-reset
db-reset: ## Apaga volume e recria o Postgres do zero
	docker compose down -v
	docker compose up -d db
	@echo "[db-reset] aguardando 5s para o Postgres terminar de inicializar..."
	@sleep 5

.PHONY: db-logs
db-logs: ## Mostra os logs do container do Postgres
	docker logs anatoquizup-quiz-postgres --tail 50 -f

.PHONY: db-status
db-status: ## Mostra o status do container do Postgres
	docker ps --filter "name=anatoquizup-quiz-postgres" --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"

# ============================================================================
#  Prisma
# ============================================================================

.PHONY: prisma-generate
prisma-generate: ## Gera o Prisma Client
	npm run prisma:generate

.PHONY: prisma-migrate
prisma-migrate: ## Aplica migrations (modo dev)
	npm run prisma:migrate

.PHONY: prisma-seed
prisma-seed: ## Roda o seed (admin)
	npm run prisma:seed

.PHONY: prisma-all
prisma-all: prisma-generate prisma-migrate prisma-seed ## generate + migrate + seed

.PHONY: prisma-studio
prisma-studio: ## Abre o Prisma Studio em http://localhost:5555
	npx prisma studio

# ============================================================================
#  Limpeza
# ============================================================================

.PHONY: clean
clean: ## Remove dist/, coverage/ e node_modules/
	rm -rf dist coverage node_modules
	@echo "[clean] dist/, coverage/ e node_modules/ removidos."
