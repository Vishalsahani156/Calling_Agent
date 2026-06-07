# Backend Folder Structure

```
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.validator.ts
│   │   │   └── auth.dto.ts
│   │   ├── users/
│   │   ├── campaigns/
│   │   ├── contacts/
│   │   ├── calls/
│   │   ├── knowledge/
│   │   ├── agents/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── webhooks/
│   │       └── exotel.webhook.controller.ts
│   ├── voice/
│   │   ├── ws-server.ts
│   │   ├── exotel-protocol.ts
│   │   ├── orchestrator/
│   │   │   ├── conversation-orchestrator.ts
│   │   │   ├── context-manager.ts
│   │   │   ├── barge-in-handler.ts
│   │   │   └── turn-state-machine.ts
│   │   └── adapters/
│   │       ├── stt/
│   │       ├── tts/
│   │       └── llm/
│   ├── jobs/
│   │   ├── queues.ts
│   │   ├── workers/
│   │   │   ├── campaign-dialer.worker.ts
│   │   │   ├── csv-import.worker.ts
│   │   │   ├── post-call.worker.ts
│   │   │   └── analytics.worker.ts
│   │   └── schedulers/
│   ├── events/
│   │   ├── event-bus.ts
│   │   └── handlers/
│   ├── middleware/
│   └── shared/
│       ├── errors/
│       ├── utils/
│       └── constants/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── tests/
├── Dockerfile
└── package.json
```

## MVP Simplification

Start with API + voice + jobs in one `backend/` folder. Split into separate deployable services when approaching ~100 concurrent calls.

## Related Docs

- [Backend Architecture](./ARCHITECTURE.md)
- [Backend Rules](./RULES.md)
