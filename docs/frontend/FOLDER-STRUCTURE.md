# Frontend Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # Dashboard overview
│   │   │   ├── campaigns/
│   │   │   ├── contacts/
│   │   │   ├── calls/
│   │   │   ├── analytics/
│   │   │   ├── knowledge/
│   │   │   ├── agents/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── features/
│   │   ├── auth/
│   │   ├── campaigns/
│   │   ├── contacts/
│   │   ├── calls/
│   │   ├── knowledge/
│   │   ├── agents/
│   │   ├── analytics/
│   │   └── settings/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/
│   │       ├── types/
│   │       └── utils/
│   ├── components/
│   │   ├── ui/                          # ShadCN UI components
│   │   ├── layout/                      # Sidebar, header, nav
│   │   └── shared/                      # Reusable cross-feature components
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── query-keys.ts
│   │   └── auth.ts
│   ├── hooks/
│   └── types/
├── public/
└── package.json
```

## Key Files

| File | Purpose |
|---|---|
| `app/providers.tsx` | QueryClientProvider, theme, toast |
| `lib/api-client.ts` | Axios/fetch wrapper with auth interceptors |
| `lib/query-keys.ts` | Centralized React Query key factory |
| `lib/auth.ts` | Token helpers, permission checks |
| `components/layout/` | Dashboard shell (sidebar, header) |

## Related Docs

- [Frontend Architecture](./ARCHITECTURE.md)
- [UI Guidelines](./UI-GUIDELINES.md)
