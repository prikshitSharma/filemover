import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";

const router = Router();
const prisma = new PrismaClient();

// GET /api/transfers — list transfer logs with filtering
router.get("/", async (req: Request, res: Response) => {
	const { jobId, status, limit = "50", offset = "0" } = req.query;

	const where: Record<string, unknown> = {};
	if (jobId) where.jobId = jobId;
	if (status) where.status = status;

	const [transfers, total] = await Promise.all([
		prisma.transferLog.findMany({
			where,
			include: {
				job: { select: { id: true, name: true } },
			},
			orderBy: { startedAt: "desc" },
			take: Number(limit),
			skip: Number(offset),
		}),
		prisma.transferLog.count({ where }),
	]);

	res.json({ transfers, total });
});

// GET /api/transfers/stats — dashboard stats
router.get("/stats", async (_req: Request, res: Response) => {
	const [totalJobs, activeJobs, totalTransfers, failedTransfers] = await Promise.all([
		prisma.job.count(),
		prisma.job.count({ where: { enabled: true } }),
		prisma.transferLog.count(),
		prisma.transferLog.count({ where: { status: "failed" } }),
	]);

	const recentTransfers = await prisma.transferLog.findMany({
		include: { job: { select: { id: true, name: true } } },
		orderBy: { startedAt: "desc" },
		take: 10,
	});

	res.json({
		totalJobs,
		activeJobs,
		totalTransfers,
		failedTransfers,
		successRate: totalTransfers > 0
			? Math.round(((totalTransfers - failedTransfers) / totalTransfers) * 100)
			: 100,
		recentTransfers,
	});
});

export { router as transfersRouter };
