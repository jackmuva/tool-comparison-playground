# Agent Guidelines

## Build/Lint/Test Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint (no --fix flag, just validation)
- `npm run generate` - Generate Drizzle ORM migrations
- `npm run migrate` - Run pending Drizzle migrations
- **Note**: No test runner configured; add tests/test runner if needed

## Code Style Guidelines

**Imports**: Use `@/` alias for imports from project root (e.g., `@/components/ui/button`). Prefer named imports for clarity; use default imports only when appropriate.

**Formatting**: 2-space indentation, 80-char soft line limit. Use TypeScript strict mode; all code must pass `npm run lint`.

**Naming**: camelCase for variables/functions, PascalCase for React components and types. Use descriptive names; avoid abbreviations.

**Types**: Always explicitly type function parameters and return values. Leverage Drizzle ORM's type inference (`$inferSelect`, `$inferInsert`). Use `type` keyword for type aliases.

**Error Handling**: Rely on TypeScript's strict type checking. Use try-catch for async operations; prefer explicit error types over generic `any`.

**Structure**: Next.js App Router (src/app), React 19, Drizzle ORM with Turso/SQLite, Zustand for state, Tailwind CSS + shadcn/ui components. DB schema in `src/db/schema.ts`, types in `src/types/types.ts`.

**No special rules**: No .cursorrules or .github/copilot-instructions.md exist.
