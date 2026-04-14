export type ConnectionType = "sftp" | "ftp" | "smb" | "sharepoint" | "azure-storage" | "local";

export interface Connection {
	id: string;
	name: string;
	type: ConnectionType;
	host: string;
	port: number | null;
	username: string | null;
	keyPath: string | null;
	extra: string | null;
	hasPassword: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ConnectionRef {
	id: string;
	name: string;
	type: ConnectionType;
	host: string;
}

export interface Job {
	id: string;
	name: string;
	sourceConnectionId: string;
	sourceConnection: ConnectionRef;
	sourcePath: string;
	destConnectionId: string;
	destConnection: ConnectionRef;
	destPath: string;
	filePattern: string;
	schedule: string | null;
	onComplete: "nothing" | "archive" | "delete";
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	_count?: { transferLogs: number };
}

export interface TransferLog {
	id: string;
	jobId: string;
	fileName: string;
	sourcePath: string;
	destPath: string;
	status: "pending" | "transferring" | "completed" | "failed";
	fileSize: number | null;
	duration: number | null;
	errorMessage: string | null;
	startedAt: string;
	completedAt: string | null;
	job?: { id: string; name: string };
}

export interface Stats {
	totalJobs: number;
	activeJobs: number;
	totalTransfers: number;
	failedTransfers: number;
	successRate: number;
	recentTransfers: TransferLog[];
}

export interface CreateConnectionInput {
	name: string;
	type: ConnectionType;
	host: string;
	port?: number;
	username?: string;
	password?: string;
	keyPath?: string;
}

export interface CreateJobInput {
	name: string;
	sourceConnectionId: string;
	sourcePath: string;
	destConnectionId: string;
	destPath: string;
	filePattern?: string;
	enabled?: boolean;
}

export interface RunSummary {
	jobId: string;
	filesAttempted: number;
	filesSucceeded: number;
	filesFailed: number;
	errors: string[];
}
