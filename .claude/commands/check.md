# Run All Quality Checks

Run linting, type checking, tests, and security audit across the entire project.

## Instructions

Run the following checks in order and report results for each:

1. **TypeScript Type Check**
   - Run `npx tsc --noEmit` in `server/` directory
   - Run `npx tsc --noEmit` in `client/` directory
   - Report any type errors found

2. **Linting** (if ESLint is configured)
   - Run `npx eslint src/` in `server/` directory
   - Run `npx eslint src/` in `client/` directory
   - Report any lint errors or warnings

3. **Formatting Check** (if Prettier is configured)
   - Run `npx prettier --check "src/**/*.{ts,tsx}"` in both directories
   - Report any formatting issues

4. **Tests**
   - Run `npm test` in `server/` directory
   - Run `npm test` in `client/` directory
   - Report pass/fail counts

5. **Security Audit**
   - Run `npm audit --audit-level=high` in root, `server/`, and `client/`
   - Report any vulnerabilities found

6. **Summary**
   - Give a clear pass/fail summary for each check
   - If anything failed, suggest the fix commands
   - If everything passed, confirm the project is ready to commit
