# Backend Documentation

Documentation for the Express API, Prisma database, voice worker, BullMQ jobs, and AI services.

## Start Here

| Document | Description |
|---|---|
| [RULES.md](./RULES.md) | Backend coding standards and conventions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Backend architecture, voice pipeline, queues, WebSockets |
| [API-ENDPOINTS.md](./API-ENDPOINTS.md) | REST API endpoint reference |
| [FOLDER-STRUCTURE.md](./FOLDER-STRUCTURE.md) | Backend project folder layout |
| [VOICE-AND-AI.md](./VOICE-AND-AI.md) | Call flows, AI conversation, knowledge base, multi-language |
| [AI-CALLING-PHASE-4.md](./AI-CALLING-PHASE-4.md) | Phase 4: STT, TTS, LLM, agent logic, orchestration, multi-language |

## Database (Phase 1 — Complete)

| Document | Description |
|---|---|
| [database/SETUP.md](./database/SETUP.md) | Local Docker and Neon PostgreSQL setup |
| [database/MIGRATION-STRATEGY.md](./database/MIGRATION-STRATEGY.md) | Migration workflow and rollback policy |
| [database/SEED-STRATEGY.md](./database/SEED-STRATEGY.md) | RBAC seed data and role-permission matrix |
| [database/SCHEMA-REFERENCE.md](./database/SCHEMA-REFERENCE.md) | Database tables, relations, and indexes |

**Live schema:** [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma)

## Tech Stack

- Node.js, Express.js, TypeScript
- Prisma ORM, PostgreSQL + pgvector
- BullMQ + Redis
- JWT + RBAC
- Exotel AgentStream

## Related

- [Frontend docs](../frontend/README.md)
- [Shared system architecture](../shared/SYSTEM-ARCHITECTURE.md)
