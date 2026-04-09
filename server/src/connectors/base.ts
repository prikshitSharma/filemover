import { Readable } from "stream";

export interface FileInfo {
	name: string;
	path: string;
	size: number;
	isDirectory: boolean;
	modifiedAt: Date;
}

export interface ConnectorConfig {
	host: string;
	port?: number;
	username?: string;
	password?: string;
	keyPath?: string;
	extra?: Record<string, unknown>;
}

export interface FileConnector {
	readonly type: string;

	connect(config: ConnectorConfig): Promise<void>;
	disconnect(): Promise<void>;
	list(remotePath: string): Promise<FileInfo[]>;
	read(remotePath: string): Promise<Readable>;
	write(remotePath: string, data: Readable): Promise<void>;
	delete(remotePath: string): Promise<void>;
	exists(remotePath: string): Promise<boolean>;
}
