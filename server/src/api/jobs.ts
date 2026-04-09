import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { JobSchema } from "../types";

const router = Router();
const prisma = new PrismaClient();

// GET /api/jobs
router.get("/", async (_req: Request, res: Response) => {
	const jobs = await prisma.job.findMany({
		include: {
			sourceConnection: { select: { id: true, name: true, type: true, host: true } },
			destConnection: { select: { id: true, name: true, type: true, host: true } },
			_count: { select: { transferLogs: true } },
		},
		orderBy: { createdAt: "desc" },
	});
	res.json(jobs);
});

// GET /api/jobs/:id
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const job = await prisma.job.findUnique({
		where: { id: req.params.id },
		include: {
			sourceConnection: { select: { id: true, name: true, type: true, host: true } },
			destConnection: { select: { id: true, name: true, type: true, host: true } },
		},
	});
	if (!job) {
		res.status(404).json({ error: "Job not found" });
		return;
	}
	res.json(job);
});

// POST /api/jobs
router.post("/", async (req: Request, res: Response) => {
	const parsed = JobSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.flatten() });
		return;
	}
	const job = await prisma.job.create({
		data: parsed.data,
		include: {
			sourceConnection: { select: { id: true, name: true, type: true, host: true } },
			destConnection: { select: { id: true, name: true, type: true, host: true } },
		},
	});
	res.status(201).json(job);
});

// PUT /api/jobs/:id
router.put("/:id", async (req: Request<{ id: string }>, res: Response) => {
	const parsed = JobSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.flatten() });
		return;
	}
	const job = await prisma.job.update({
		where: { id: req.params.id },
		data: parsed.data,
		include: {
			sourceConnection: { select: { id: true, name: true, type: true, host: true } },
			destConnection: { select: { id: true, name: true, type: true, host: true } },
		},
	});
	res.json(job);
});

// DELETE /api/jobs/:id
router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
	await prisma.job.delete({
		where: { id: req.params.id },
	});
	res.status(204).send();
});

export { router as jobsRouter };
