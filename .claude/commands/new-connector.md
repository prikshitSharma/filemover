# New Connector

Create a new protocol connector for FileMover.

## Instructions

1. Ask the user which protocol to create a connector for (e.g., sftp, ftp, smb, sharepoint, azure-storage) if not provided as argument: $ARGUMENTS
2. Read the base connector interface from `server/src/connectors/base.ts` to understand the `FileConnector` interface
3. Create a new file in `server/src/connectors/<protocol>.ts` that:
   - Imports and implements the `FileConnector` interface
   - Implements all required methods: `connect()`, `list()`, `read()`, `write()`, `delete()`, `disconnect()`
   - Uses the appropriate npm library for the protocol
   - Includes proper error handling with contextual error messages
   - Uses `async/await` (no callbacks or `.then()` chains)
   - Uses semicolons and tab indentation
   - Uses named exports
4. If the required npm library is not yet installed, install it in the `server/` directory and run `npm audit --audit-level=high` to check for vulnerabilities
5. Create a test file at `server/src/connectors/<protocol>.test.ts` with:
   - Connection test (mock or test server)
   - List files test
   - Read/write file test
   - Disconnect/cleanup test
6. Register the new connector in the connector index file if one exists (`server/src/connectors/index.ts`)
7. Report what was created and any next steps
