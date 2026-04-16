import { Readable } from "stream";
import SftpClient from "ssh2-sftp-client";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

export class SftpConnector implements FileConnector {
	readonly type = "sftp";
	private client = new SftpClient();
	private connected = false;

	async connect(config: ConnectorConfig): Promise<void> {
		await this.client.connect({
			host: config.host,
			port: config.port ?? 22,
			username: config.username,
			password: config.password,
			privateKey: config.keyPath ? await this.loadKey(config.keyPath) : undefined,
			passphrase: config.passphrase,
			readyTimeout: 15_000,
		});
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		if (this.connected) {
			await this.client.end();
			this.connected = false;
		}
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const entries = await this.client.list(remotePath);
		return entries.map((e) => ({
			name: e.name,
			path: joinPath(remotePath, e.name),
			size: e.size,
			isDirectory: e.type === "d",
			modifiedAt: new Date(e.modifyTime),
		}));
	}

	async read(remotePath: string): Promise<Readable> {
		const buf = (await this.client.get(remotePath)) as Buffer;
		return Readable.from(buf);
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		await this.client.put(data, remotePath);
	}

	async delete(remotePath: string): Promise<void> {
		await this.client.delete(remotePath);
	}

	async exists(remotePath: string): Promise<boolean> {
		const result = await this.client.exists(remotePath);
		return result !== false;
	}

	private async loadKey(keyPath: string): Promise<Buffer> {
		const { readFile } = await import("fs/promises");
		return readFile(keyPath);
	}
}

function joinPath(dir: string, name: string): string {
	if (dir.endsWith("/")) return dir + name;
	return dir + "/" + name;
}
