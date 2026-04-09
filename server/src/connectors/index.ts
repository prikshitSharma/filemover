export type { FileConnector, FileInfo, ConnectorConfig } from "./base";

// Connector registry — add new connectors here
const connectorMap: Record<string, () => Promise<import("./base").FileConnector>> = {
	// sftp: async () => new (await import("./sftp")).SftpConnector(),
	// ftp: async () => new (await import("./ftp")).FtpConnector(),
	// smb: async () => new (await import("./smb")).SmbConnector(),
	// sharepoint: async () => new (await import("./sharepoint")).SharePointConnector(),
	// "azure-storage": async () => new (await import("./azure-storage")).AzureStorageConnector(),
};

export async function createConnector(type: string): Promise<import("./base").FileConnector> {
	const factory = connectorMap[type];
	if (!factory) {
		throw new Error(`Unknown connector type: ${type}. Available: ${Object.keys(connectorMap).join(", ")}`);
	}
	return factory();
}
