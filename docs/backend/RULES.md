# Backend Rules

Coding standards for Express API, Prisma, voice worker, and background jobs.

## API Rules

Use REST API under `/api/v1`:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/campaigns`
- `/api/v1/contacts`
- `/api/v1/calls`
- `/api/v1/knowledge-base`

See [API-ENDPOINTS.md](./API-ENDPOINTS.md) for the full list.

## Architecture Layers

```
Route → Validator → Controller → Service → Repository → Prisma
```

### Controller Rules

Controllers should:

- Validate requests
- Call services
- Return responses

**No business logic in controllers.**

### Service Rules

Services contain:

- Business logic
- AI workflows
- Campaign workflows
- Call workflows

### Repository Rules

Repositories contain Prisma queries only. No business logic.

## Database Rules

Use Prisma. Create:

- Proper relations
- Indexes
- Constraints
- Transactions

Avoid raw SQL unless necessary.

See [database/SCHEMA-REFERENCE.md](./database/SCHEMA-REFERENCE.md).

## Middleware

Required middleware:

- `auth` — JWT verification
- `rbac` — permission checks
- `rateLimit` — request throttling
- `requestId` — trace correlation
- `errorHandler` — consistent error responses
- `auditLog` — mutating action logging

## Security Rules

Always implement:

- Input validation (Zod)
- JWT verification
- Rate limiting
- Audit logging
- Secure file uploads

Never expose secrets, tokens, or credentials.

## AI Rules

AI services must:

- Support multiple languages
- Maintain conversation context
- Handle interruptions (barge-in)
- Answer business questions via knowledge base RAG
- Generate call summaries
- Store conversation history

## Performance Rules

Optimize for:

- 100k+ contacts
- High concurrency
- Queue-based processing (BullMQ)
- Background jobs

Avoid blocking the request thread for dial, import, or analytics work.

## Related Docs

- [Backend Architecture](./ARCHITECTURE.md)
- [Voice and AI](./VOICE-AND-AI.md)
- [Database Setup](./database/SETUP.md)
