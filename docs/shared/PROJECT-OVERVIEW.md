# Project Overview

This is a production-grade **AI Voice Calling Agent** SaaS platform.

## What the Platform Does

Administrators can:

- Create AI calling campaigns
- Upload contacts
- Start outbound AI calls
- Configure AI agents
- Manage knowledge bases
- Monitor calls
- View analytics
- Manage users and permissions

The application must be scalable, maintainable, secure, and production-ready.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind, ShadCN UI, TanStack Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon-compatible) + pgvector |
| Auth | JWT, Refresh Tokens, RBAC |
| Telephony | Exotel AgentStream |
| Queue | BullMQ + Redis |

## Project Phases

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Database layer (Prisma) | Complete |
| Phase 2 | Backend API (Express) | Not started |
| Phase 3 | Frontend dashboard (Next.js) | Not started |
| Phase 4 | Voice worker + Exotel integration | Not started |

## Documentation Map

```
docs/
├── backend/     → API, database, voice, AI
├── frontend/    → Dashboard, UI, React Query
└── shared/      → System architecture, roadmaps, general rules
```

## Related Docs

- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [Development Rules](./DEVELOPMENT-RULES.md)
- [System Architecture](./SYSTEM-ARCHITECTURE.md)
