import { Readable } from "stream";
import { Client as FtpClient } from "basic-ftp";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

export class FtpConnector implements FileConnector {
	readonly type = "ftp";
	private client = new FtpClient();
	private connected = false;

	async connect(config: ConnectorConfig): Promise<void> {
		const secure = (config.extra as Record<string, unknown>)?.secure === true;
		this.client.ftp.verbose = false;
		await this.client.access({
			host: config.host,
			port: config.port ?? 21,
			user: config.username ?? "anonymous",
			password: config.password ?? "",
			secure,
			secureOptions: secure ? { rejectUnauthorized: false } : undefined,
		});
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		if (this.connected) {
			this.client.close();
			this.connected = false;
		}
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const entries = await this.client.list(remotePath);
		return entries.map((e) => ({
			name: e.name,
			path: joinPath(remotePath, e.name),
			size: e.size,
			isDirectory: e.isDirectory,
			modifiedAt: e.modifiedAt ?? new Date(),
		}));
	}

	async read(remotePath: string): Promise<Readable> {
		const chunks: Buffer[] = [];
		const writable = new (await import("stream")).Writable({
			write(chunk, _enc, cb) {
				chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
				cb();
			},
		});
		await this.client.downloadTo(writable, remotePath);
		return Readable.from(Buffer.concat(chunks));
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		await this.client.uploadFrom(data, remotePath);
	}

	async delete(remotePath: string): Promise<void> {
		await this.client.remove(remotePath);
	}

	async exists(remotePath: string): Promise<boolean> {
		try {
			await this.client.size(remotePath);
			return true;
		} catch {
			try {
				const entries = await this.client.list(remotePath);
				return entries.length >= 0;
			} catch {
				return false;
			}
		}
	}
}

function joinPath(dir: string, name: string): string {
	if (dir.endsWith("/")) return dir + name;
	return dir + "/" + name;
}
