# Frontend Architecture

Next.js App Router architecture for the admin dashboard.

## Route Groups

| Group | Routes | Purpose |
|---|---|---|
| `(auth)` | `/login`, `/register`, `/forgot-password` | Public auth pages |
| `(dashboard)` | `/`, `/campaigns`, `/contacts`, etc. | Protected admin area |
| `(public)` | Marketing/landing (optional) | Public pages |

## Feature Modules

Each feature in `src/features/{name}/` contains:

```
features/{name}/
  components/    # Feature-specific UI
  hooks/         # useCampaigns, useContacts, etc.
  api/           # API call functions
  types/         # TypeScript interfaces
  utils/         # Helpers
```

Features: `auth`, `campaigns`, `contacts`, `calls`, `knowledge`, `agents`, `analytics`, `settings`

## State Management

| Data type | Approach |
|---|---|
| Server data | TanStack React Query (`useQuery`, `useMutation`) |
| UI ephemeral | Local component state (modals, sidebar) |
| Auth session | HTTP-only cookies + `lib/auth.ts` helpers |

**No global client store** (Redux/Zustand) unless a clear need emerges.

## React Query Strategy

```typescript
// Query keys — centralized in lib/query-keys.ts
['campaigns', orgId]
['campaign', id]
['calls', filters]
['contacts', { page, search }]
```

- Mutations invalidate related query keys
- Poll active campaign stats every 5–10s
- WebSocket for live call monitoring
- Prefetch dashboard data in layout

## Authentication Flow

1. User submits login form
2. API returns access token + sets refresh cookie
3. Next.js middleware checks auth on dashboard routes
4. RBAC guards hide/disable UI by permission
5. Token refresh handled in `lib/api-client.ts` interceptor

## Server vs Client Components

| Use Server Components | Use Client Components |
|---|---|
| Static page shells | Interactive tables and forms |
| Layout wrappers | Charts and real-time data |
| SEO/public pages | Modals, dropdowns, toasts |

## Related Docs

- [Folder Structure](./FOLDER-STRUCTURE.md)
- [UI Guidelines](./UI-GUIDELINES.md)
- [Frontend Rules](./RULES.md)
- [Backend API](../backend/API-ENDPOINTS.md)
