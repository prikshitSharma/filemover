import { createReadStream, createWriteStream } from "fs";
import { mkdir, readdir, stat, unlink, access } from "fs/promises";
import { dirname, isAbsolute, normalize, resolve, sep } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

export class LocalConnector implements FileConnector {
	readonly type = "local";
	private rootPath = "";

	async connect(config: ConnectorConfig): Promise<void> {
		const root = config.host;
		if (!root || !isAbsolute(root)) {
			throw new Error("Local connector requires an absolute root path in the host field.");
		}
		this.rootPath = normalize(root);
		await mkdir(this.rootPath, { recursive: true });
	}

	async disconnect(): Promise<void> {
		this.rootPath = "";
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const abs = this.resolveJailed(remotePath);
		const entries = await readdir(abs, { withFileTypes: true });
		const infos = await Promise.all(
			entries.map(async (e) => {
				const entryAbs = resolve(abs, e.name);
				const s = await stat(entryAbs);
				return {
					name: e.name,
					path: this.toVirtualPath(entryAbs),
					size: s.size,
					isDirectory: e.isDirectory(),
					modifiedAt: s.mtime,
				};
			}),
		);
		return infos;
	}

	async read(remotePath: string): Promise<Readable> {
		return createReadStream(this.resolveJailed(remotePath));
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		const abs = this.resolveJailed(remotePath);
		await mkdir(dirname(abs), { recursive: true });
		await pipeline(data, createWriteStream(abs));
	}

	async delete(remotePath: string): Promise<void> {
		await unlink(this.resolveJailed(remotePath));
	}

	async exists(remotePath: string): Promise<boolean> {
		try {
			await access(this.resolveJailed(remotePath));
			return true;
		} catch {
			return false;
		}
	}

	private resolveJailed(remotePath: string): string {
		if (!this.rootPath) throw new Error("LocalConnector not connected");
		const cleaned = remotePath.replace(/^[/\\]+/, "");
		const abs = normalize(resolve(this.rootPath, cleaned));
		if (abs !== this.rootPath && !abs.startsWith(this.rootPath + sep)) {
			throw new Error(`Path escapes root: ${remotePath}`);
		}
		return abs;
	}

	private toVirtualPath(abs: string): string {
		const rel = abs.slice(this.rootPath.length).replace(/\\/g, "/");
		return rel.startsWith("/") ? rel : "/" + rel;
	}
}
