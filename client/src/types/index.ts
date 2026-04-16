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
	hasPassphrase: boolean;
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

export type SharePointAuthType = "client_secret" | "client_certificate" | "password";

export interface SharePointExtra {
	authType: SharePointAuthType;
	tenantId: string;
	clientId: string;
	siteUrl: string;
	driveId?: string;
	certificatePath?: string;
}

export type AzureStorageAuthType = "connection_string" | "account_key" | "sas_token" | "azure_ad";

export interface AzureStorageExtra {
	authType: AzureStorageAuthType;
	accountName?: string;
	containerName: string;
	tenantId?: string;
	clientId?: string;
}

export interface CreateConnectionInput {
	name: string;
	type: ConnectionType;
	host: string;
	port?: number;
	username?: string;
	password?: string;
	keyPath?: string;
	passphrase?: string;
	extra?: Record<string, unknown>;
}

export interface CreateJobInput {
	name: string;
	sourceConnectionId: string;
	sourcePath: string;
	destConnectionId: string;
	destPath: string;
	filePattern?: string;
	schedule?: string | null;
	enabled?: boolean;
}

export interface RunSummary {
	jobId: string;
	filesAttempted: number;
	filesSucceeded: number;
	filesFailed: number;
	errors: string[];
}
