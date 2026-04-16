import cron, { type ScheduledTask } from "node-cron";
import { PrismaClient } from "../generated/prisma/client";
import { runJob } from "./transferEngine";

const prisma = new PrismaClient();

const activeTasks = new Map<string, ScheduledTask>();

export async function startScheduler(): Promise<void> {
	const jobs = await prisma.job.findMany({
		where: { enabled: true, schedule: { not: null } },
	});
	for (const job of jobs) {
		scheduleJob(job.id, job.schedule!);
	}
	console.log(`[scheduler] started with ${jobs.length} scheduled job(s)`);
}

export function scheduleJob(jobId: string, cronExpr: string): void {
	unscheduleJob(jobId);

	if (!cron.validate(cronExpr)) {
		console.warn(`[scheduler] invalid cron expression for job ${jobId}: ${cronExpr}`);
		return;
	}

	const task = cron.schedule(cronExpr, async () => {
		console.log(`[scheduler] running job ${jobId}`);
		try {
			const summary = await runJob(jobId);
			console.log(
				`[scheduler] job ${jobId} complete: ${summary.filesSucceeded}/${summary.filesAttempted} succeeded`,
			);
		} catch (err) {
			console.error(`[scheduler] job ${jobId} failed:`, err instanceof Error ? err.message : err);
		}
	});

	activeTasks.set(jobId, task);
}

export function unscheduleJob(jobId: string): void {
	const existing = activeTasks.get(jobId);
	if (existing) {
		existing.stop();
		activeTasks.delete(jobId);
	}
}

export async function refreshJob(jobId: string): Promise<void> {
	const job = await prisma.job.findUnique({ where: { id: jobId } });
	if (job?.enabled && job.schedule) {
		scheduleJob(jobId, job.schedule);
	} else {
		unscheduleJob(jobId);
	}
}

export function stopScheduler(): void {
	for (const [id, task] of activeTasks) {
		task.stop();
		activeTasks.delete(id);
	}
	console.log("[scheduler] stopped");
}

export function getScheduledJobIds(): string[] {
	return Array.from(activeTasks.keys());
}
