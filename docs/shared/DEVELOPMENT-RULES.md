# General Development Rules

These rules apply to **both backend and frontend** development.

## Rule 1 — Preserve Existing Logic

Never change existing business logic unless explicitly requested. Always preserve current functionality.

## Rule 2 — Analyze Before Coding

Before generating code:

1. Analyze existing architecture
2. Analyze dependencies
3. Analyze folder structure
4. Analyze database schema

Then propose changes.

## Rule 3 — Production Quality Only

Always generate production-quality code. Avoid:

- Demo code
- Mock code
- Temporary code
- Placeholder implementations

## Rule 4 — Clean Architecture

Use layered separation. Do not place business logic in controllers (backend) or UI components (frontend).

## Rule 5 — TypeScript Only

All code must be TypeScript. Never use JavaScript.

## Rule 6 — Reusable Code

Create reusable modules and components. Avoid duplicate code.

## Code Generation Rules

Before writing code:

1. Analyze existing files
2. Explain changes
3. List affected files
4. Generate complete code
5. Ensure no existing functionality breaks

Never generate incomplete implementations. Never remove existing features. Always preserve backward compatibility.

## Final Rule

Every decision should prioritize:

- Scalability
- Maintainability
- Security
- Performance
- User Experience
- Production Readiness

## Layer-Specific Rules

| Layer | Document |
|---|---|
| Backend | [../backend/RULES.md](../backend/RULES.md) |
| Frontend | [../frontend/RULES.md](../frontend/RULES.md) |
