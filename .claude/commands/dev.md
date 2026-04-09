# Start Dev Servers

Start the development servers for FileMover (frontend + backend).

## Instructions

1. Check if `node_modules` exist in both `client/` and `server/` directories
2. If missing, run `npm install` in the directories that need it
3. Start both dev servers:
   - Backend: `cd server && npm run dev`
   - Frontend: `cd client && npm run dev`
4. Run them in the background so the user can continue working
5. Report the URLs where each server is running (typically backend on :3001, frontend on :5173)
6. Remind the user they can stop the servers with Ctrl+C in the respective terminals
