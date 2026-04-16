import { Readable } from "stream";
import SMB2 from "@marsaud/smb2";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

export class SmbConnector implements FileConnector {
	readonly type = "smb";
	private client!: SMB2;

	async connect(config: ConnectorConfig): Promise<void> {
		const domain = (config.extra as Record<string, unknown>)?.domain as string | undefined;

		this.client = new SMB2({
			share: `\\\\${config.host}\\${this.getShareName(config)}`,
			port: config.port ?? 445,
			domain: domain ?? "",
			username: config.username ?? "",
			password: config.password ?? "",
		});
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.disconnect();
		}
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const smbPath = toSmbPath(remotePath);
		const entries = await this.client.readdir(smbPath, { stats: true }) as SmbDirEntry[];
		return entries
			.filter((e) => e.name !== "." && e.name !== "..")
			.map((e) => ({
				name: e.name,
				path: joinPath(remotePath, e.name),
				size: Number(e.stats?.size ?? 0),
				isDirectory: e.stats?.isDirectory() ?? false,
				modifiedAt: e.stats?.mtime ?? new Date(),
			}));
	}

	async read(remotePath: string): Promise<Readable> {
		const smbPath = toSmbPath(remotePath);
		const stream = await this.client.createReadStream(smbPath);
		return stream as unknown as Readable;
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		const smbPath = toSmbPath(remotePath);
		const chunks: Buffer[] = [];
		for await (const chunk of data) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		await this.client.writeFile(smbPath, Buffer.concat(chunks));
	}

	async delete(remotePath: string): Promise<void> {
		const smbPath = toSmbPath(remotePath);
		await this.client.unlink(smbPath);
	}

	async exists(remotePath: string): Promise<boolean> {
		try {
			const smbPath = toSmbPath(remotePath);
			await this.client.stat(smbPath);
			return true;
		} catch {
			return false;
		}
	}

	private getShareName(config: ConnectorConfig): string {
		const shareName = (config.extra as Record<string, unknown>)?.shareName as string | undefined;
		return shareName ?? config.host;
	}
}

interface SmbDirEntry {
	name: string;
	stats?: {
		size: bigint | number;
		isDirectory(): boolean;
		mtime: Date;
	};
}

function toSmbPath(p: string): string {
	return p.replace(/^\/+/, "").replace(/\//g, "\\");
}

function joinPath(dir: string, name: string): string {
	if (dir.endsWith("/")) return dir + name;
	return dir + "/" + name;
}
