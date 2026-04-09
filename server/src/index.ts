import express from "express";
import cors from "cors";
import { connectionsRouter } from "./api/connections";
import { jobsRouter } from "./api/jobs";
import { transfersRouter } from "./api/transfers";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/connections", connectionsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/transfers", transfersRouter);

// Health check
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`FileMover server running on http://localhost:${PORT}`);
});
