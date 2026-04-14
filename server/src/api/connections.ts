import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { ConnectionSchema } from "../types";
import { createConnector } from "../connectors";

const router = Router();
const prisma = new PrismaClient();

// GET /api/connections
router.get("/", async (_req: Request, res: Response) => {
	const connections = await prisma.connection.findMany({
		orderBy: { createdAt: "desc" },
	});
	// Never send passwords to the client
	const safe = connections.map(({ password, ...rest }) => ({
		...rest,
		hasPassword: !!password,
	}));
	res.json(safe);
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
	const { password, ...safe } = connection;
	res.json({ ...safe, hasPassword: !!password });
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
	const { password, ...safe } = connection;
	res.status(201).json({ ...safe, hasPassword: !!password });
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
	const { password, ...safe } = connection;
	res.json({ ...safe, hasPassword: !!password });
});

// DELETE /api/connections/:id
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
	await prisma.connection.delete({
		where: { id: req.params.id },
	});
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
