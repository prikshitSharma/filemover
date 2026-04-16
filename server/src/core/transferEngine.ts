import { PrismaClient } from "../generated/prisma/client";
import { createConnector, type ConnectorConfig, type FileConnector } from "../connectors";

const prisma = new PrismaClient();

const RETRY_DELAYS_MS = [1000, 2000, 4000];

export interface RunSummary {
	jobId: string;
	filesAttempted: number;
	filesSucceeded: number;
	filesFailed: number;
	errors: string[];
}

export async function runJob(jobId: string): Promise<RunSummary> {
	const job = await prisma.job.findUnique({
		where: { id: jobId },
		include: { sourceConnection: true, destConnection: true },
	});
	if (!job) throw new Error(`Job not found: ${jobId}`);

	const summary: RunSummary = { jobId, filesAttempted: 0, filesSucceeded: 0, filesFailed: 0, errors: [] };

	const source = await createConnector(job.sourceConnection.type);
	const dest = await createConnector(job.destConnection.type);

	try {
		await source.connect(toConfig(job.sourceConnection));
		await dest.connect(toConfig(job.destConnection));

		const entries = await source.list(job.sourcePath);
		const files = entries.filter((e) => !e.isDirectory && matchesPattern(e.name, job.filePattern));

		for (const file of files) {
			summary.filesAttempted++;
			const destFilePath = joinPath(job.destPath, file.name);
			const log = await prisma.transferLog.create({
				data: {
					jobId: job.id,
					fileName: file.name,
					sourcePath: file.path,
					destPath: destFilePath,
					status: "transferring",
					fileSize: file.size,
				},
			});
			const started = Date.now();
			try {
				await transferOneWithRetry(source, dest, file.path, destFilePath);
				await prisma.transferLog.update({
					where: { id: log.id },
					data: { status: "completed", completedAt: new Date(), duration: Date.now() - started },
				});
				summary.filesSucceeded++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				await prisma.transferLog.update({
					where: { id: log.id },
					data: {
						status: "failed",
						completedAt: new Date(),
						duration: Date.now() - started,
						errorMessage: message,
					},
				});
				summary.filesFailed++;
				summary.errors.push(`${file.name}: ${message}`);
			}
		}
	} finally {
		await source.disconnect().catch(() => undefined);
		await dest.disconnect().catch(() => undefined);
	}
	return summary;
}

async function transferOneWithRetry(source: FileConnector, dest: FileConnector, srcPath: string, destPath: string): Promise<void> {
	let lastError: unknown;
	for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
		try {
			const stream = await source.read(srcPath);
			await dest.write(destPath, stream);
			return;
		} catch (err) {
			lastError = err;
			if (attempt < RETRY_DELAYS_MS.length) {
				await sleep(RETRY_DELAYS_MS[attempt]);
			}
		}
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function toConfig(c: {
	host: string;
	port: number | null;
	username: string | null;
	password: string | null;
	keyPath: string | null;
	passphrase: string | null;
	extra: string | null;
}): ConnectorConfig {
	return {
		host: c.host,
		port: c.port ?? undefined,
		username: c.username ?? undefined,
		password: c.password ?? undefined,
		keyPath: c.keyPath ?? undefined,
		passphrase: c.passphrase ?? undefined,
		extra: c.extra ? (JSON.parse(c.extra) as Record<string, unknown>) : undefined,
	};
}

function matchesPattern(name: string, pattern: string): boolean {
	if (!pattern || pattern === "*") return true;
	const regex = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
	return regex.test(name);
}

function joinPath(dir: string, name: string): string {
	if (dir.endsWith("/")) return dir + name;
	return dir + "/" + name;
}

function sleep(ms: number): Promise<void> {
	return new Promise((res) => setTimeout(res, ms));
}
