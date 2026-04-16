import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { unlink, mkdir } from "fs/promises";
import path from "path";
import multer from "multer";
import { PrismaClient } from "../generated/prisma/client";
import { ConnectionSchema } from "../types";
import { createConnector } from "../connectors";

const router = Router();
const prisma = new PrismaClient();

const KEYS_DIR = path.resolve(process.cwd(), "keys");
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

function stripSecrets<T extends { password: string | null; passphrase: string | null }>(connection: T) {
	const { password, passphrase, ...rest } = connection;
	return { ...rest, hasPassword: !!password, hasPassphrase: !!passphrase };
}

// GET /api/connections
router.get("/", async (_req: Request, res: Response) => {
	const connections = await prisma.connection.findMany({
		orderBy: { createdAt: "desc" },
	});
	res.json(connections.map(stripSecrets));
});

// GET /api/connections/:id
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const connection = await prisma.connection.findUnique({
		where: { id: req.params.id },
	});
	if (!connection) {
		res.status(404).json({ error: "Connection not found" });
		return;
	}
	res.json(stripSecrets(connection));
});

// POST /api/connections/upload-key — save private key file, return keyPath for subsequent connection create
router.post("/upload-key", upload.single("key"), async (req: Request, res: Response) => {
	if (!req.file) {
		res.status(400).json({ error: "No file uploaded" });
		return;
	}
	await mkdir(KEYS_DIR, { recursive: true });
	const fileName = `${randomUUID()}.key`;
	const absolutePath = path.join(KEYS_DIR, fileName);
	const { writeFile } = await import("fs/promises");
	await writeFile(absolutePath, req.file.buffer, { mode: 0o600 });
	res.status(201).json({ keyPath: `keys/${fileName}` });
});

// POST /api/connections
router.post("/", async (req: Request, res: Response) => {
	const parsed = ConnectionSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.flatten() });
		return;
	}
	const { extra, ...data } = parsed.data;
	const connection = await prisma.connection.create({
		data: {
			...data,
			extra: extra ? JSON.stringify(extra) : null,
		},
	});
	res.status(201).json(stripSecrets(connection));
});

// PUT /api/connections/:id
router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const parsed = ConnectionSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.flatten() });
		return;
	}
	const { extra, ...data } = parsed.data;
	const connection = await prisma.connection.update({
		where: { id: req.params.id },
		data: {
			...data,
			extra: extra ? JSON.stringify(extra) : null,
		},
	});
	res.json(stripSecrets(connection));
});

// DELETE /api/connections/:id
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const connection = await prisma.connection.findUnique({ where: { id: req.params.id } });
	if (!connection) {
		res.status(404).json({ error: "Connection not found" });
		return;
	}
	if (connection.keyPath) {
		const absolute = path.resolve(process.cwd(), connection.keyPath);
		if (absolute.startsWith(KEYS_DIR + path.sep)) {
			await unlink(absolute).catch(() => undefined);
		}
	}
	await prisma.connection.delete({ where: { id: req.params.id } });
	res.status(204).send();
});

// POST /api/connections/:id/test — verify credentials by connecting and disconnecting
router.post("/:id/test", async (req: Request<{ id: string }>, res: Response) => {
	const connection = await prisma.connection.findUnique({ where: { id: req.params.id } });
	if (!connection) {
		res.status(404).json({ error: "Connection not found" });
		return;
	}
	const connector = await createConnector(connection.type);
	try {
		await connector.connect({
			host: connection.host,
			port: connection.port ?? undefined,
			username: connection.username ?? undefined,
			password: connection.password ?? undefined,
			keyPath: connection.keyPath ?? undefined,
			passphrase: connection.passphrase ?? undefined,
			extra: connection.extra ? (JSON.parse(connection.extra) as Record<string, unknown>) : undefined,
		});
		await connector.disconnect();
		res.json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		await connector.disconnect().catch(() => undefined);
		res.status(400).json({ ok: false, error: message });
	}
});

export { router as connectionsRouter };
