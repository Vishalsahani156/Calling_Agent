# AI Voice Calling Agent Platform

SaaS platform for AI-powered outbound voice calling campaigns with multi-language support, knowledge base RAG, and Exotel telephony integration.

## Status

**Phase 1 complete** — production-ready Prisma database layer implemented.

| Phase | Status |
|---|---|
| Phase 1: Database layer | Complete |
| Phase 2: Backend API | Not started |
| Phase 3: Frontend | Not started |

## Quick Start (Database)

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:validate
```

Full instructions: [docs/backend/database/SETUP.md](./docs/backend/database/SETUP.md)

## Documentation

Documentation is organized by layer:

| Layer | Index |
|---|---|
| **Backend** | [docs/backend/README.md](./docs/backend/README.md) |
| **Frontend** | [docs/frontend/README.md](./docs/frontend/README.md) |
| **Shared** | [docs/shared/README.md](./docs/shared/README.md) |
| **All docs** | [docs/README.md](./docs/README.md) |

### Backend Docs

| Document | Description |
|---|---|
| [Rules](./docs/backend/RULES.md) | Backend coding standards |
| [Architecture](./docs/backend/ARCHITECTURE.md) | API, voice, queues |
| [API Endpoints](./docs/backend/API-ENDPOINTS.md) | REST API reference |
| [Database Setup](./docs/backend/database/SETUP.md) | PostgreSQL setup |
| [Schema Reference](./docs/backend/database/SCHEMA-REFERENCE.md) | Tables and relations |

### Frontend Docs

| Document | Description |
|---|---|
| [Rules](./docs/frontend/RULES.md) | Frontend coding standards |
| [Architecture](./docs/frontend/ARCHITECTURE.md) | App Router, React Query |
| [UI Guidelines](./docs/frontend/UI-GUIDELINES.md) | Dashboard design |

### Shared Docs

| Document | Description |
|---|---|
| [Project Overview](./docs/shared/PROJECT-OVERVIEW.md) | Platform overview |
| [System Architecture](./docs/shared/SYSTEM-ARCHITECTURE.md) | High-level design |
| [Development Rules](./docs/shared/DEVELOPMENT-RULES.md) | General rules |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TanStack Query, TypeScript, Tailwind, ShadCN UI |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL (Neon) + pgvector |
| Telephony | Exotel AgentStream |
| Queue | BullMQ + Redis |

## Project Structure

```
Calling/
├── backend/prisma/          # Database (Phase 1 complete)
├── docs/
│   ├── backend/             # Backend documentation
│   ├── frontend/            # Frontend documentation
│   └── shared/              # System-wide documentation
├── docker-compose.yml
└── package.json
```
# Calling_Agent
