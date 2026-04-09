# FileMover - Project Rules

## What This Project Is

FileMover is a universal file transfer application that moves files between SFTP, FTP, SMB, SharePoint, and Azure Storage accounts. Any source to any destination.

- **Monorepo**: `client/` (React + Vite + Tailwind + shadcn/ui) and `server/` (Node.js + Express + TypeScript)
- **Database**: SQLite via Prisma ORM
- **Scheduler**: node-cron for scheduled transfer jobs

## Code Conventions

- TypeScript strict mode in both client and server
- Semicolons: always use semicolons
- Indentation: tabs (not spaces)
- Use `async/await` everywhere, no raw callbacks or `.then()` chains
- Prettier for formatting — run before every commit
- Prefer named exports over default exports
- Use descriptive variable names — no single-letter variables except loop counters

## Architecture Rules

- All protocol connectors must implement the `FileConnector` interface defined in `server/src/connectors/base.ts`
- Adding a new protocol = create a new file in `server/src/connectors/` implementing `FileConnector`
- Business logic belongs in `server/src/core/` — API route handlers must stay thin (validate input, call core, return response)
- Frontend API calls must go through the centralized API client in `client/src/api/` — no scattered `fetch()` calls in components
- React components go in `client/src/components/`, pages in `client/src/pages/`
- Use React Router for navigation
- Use React Query (TanStack Query) for server state management

## Database Rules

- All schema changes go through Prisma migrations — never edit the DB directly
- Tables: Connections (saved profiles), Jobs (transfer definitions), TransferLogs (audit trail)
- Every transfer must be logged with: job ID, source path, destination path, file name, status, timestamp, error message (if any)

## Security Rules (Critical)

- NEVER hardcode credentials — use environment variables or encrypted DB fields
- `.env` must always be in `.gitignore` — no exceptions
- Validate and sanitize all user input on API routes
- Sanitize file paths to prevent directory traversal attacks (`../` injection)
- Never log full credentials — mask passwords and tokens in logs
- Use HTTPS for SharePoint and Azure connections
- After adding or updating any npm dependency, ALWAYS run `npm audit` in the affected package (client/, server/, or root) and report any vulnerabilities found. Do not proceed if critical or high severity vulnerabilities exist — find an alternative package or fix the vulnerability first.

## Error Handling

- Never silently swallow errors — always log or propagate
- Failed transfers must retry 3x with exponential backoff (1s, 2s, 4s) before marking as failed
- All errors must include context: which job, which file, which connector, what failed
- Return meaningful HTTP error codes and messages from API routes

## Testing

- Every connector needs: connection test + file transfer test
- API routes need integration tests
- Use mock/test servers for SFTP and FTP in test environment
- Test file: same folder as source, named `*.test.ts`

## Git & Commits

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One feature per branch, branched from `main`
- PR required before merging to `main`
- Branch naming: `feat/description`, `fix/description`, `refactor/description`
- Keep commits small and focused — one concern per commit

## File Structure

```
filemover/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/                # Centralized API client
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components (Dashboard, Jobs, Connections, Logs, Settings)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # Shared TypeScript types
│   │   └── App.tsx
│   └── package.json
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── connectors/         # Protocol connectors (base, sftp, ftp, smb, sharepoint, azure)
│   │   ├── core/               # Transfer engine, scheduler, retry logic
│   │   ├── api/                # Express route handlers
│   │   ├── middleware/         # Auth, validation, error handling middleware
│   │   ├── types/              # Shared TypeScript types
│   │   └── index.ts
│   └── package.json
├── prisma/
│   └── schema.prisma           # Database schema
├── .env.example                # Template for environment variables
├── .gitignore
├── CLAUDE.md                   # This file — project rules
└── package.json                # Root package.json (workspace config)
```
