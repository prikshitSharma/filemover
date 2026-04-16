import { Readable } from "stream";
import {
	BlobServiceClient,
	ContainerClient,
	StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { ClientSecretCredential } from "@azure/identity";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

type AzureAuthType = "connection_string" | "account_key" | "sas_token" | "azure_ad";

interface AzureStorageExtra {
	authType: AzureAuthType;
	accountName?: string;
	containerName: string;
	tenantId?: string;
	clientId?: string;
}

export class AzureStorageConnector implements FileConnector {
	readonly type = "azure-storage";
	private container!: ContainerClient;

	async connect(config: ConnectorConfig): Promise<void> {
		const extra = config.extra as unknown as AzureStorageExtra;
		if (!extra?.containerName) {
			throw new Error("Azure Storage requires containerName in extra config");
		}

		const blobService = this.buildClient(extra, config);
		this.container = blobService.getContainerClient(extra.containerName);

		const exists = await this.container.exists();
		if (!exists) {
			throw new Error(`Container "${extra.containerName}" does not exist`);
		}
	}

	async disconnect(): Promise<void> {
		// Blob SDK is stateless
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const prefix = normalizePath(remotePath);
		const results: FileInfo[] = [];

		for await (const item of this.container.listBlobsByHierarchy("/", { prefix })) {
			if (item.kind === "prefix") {
				results.push({
					name: trimPrefix(item.name, prefix).replace(/\/$/, ""),
					path: "/" + item.name.replace(/\/$/, ""),
					size: 0,
					isDirectory: true,
					modifiedAt: new Date(),
				});
			} else {
				results.push({
					name: trimPrefix(item.name, prefix),
					path: "/" + item.name,
					size: item.properties.contentLength ?? 0,
					isDirectory: false,
					modifiedAt: item.properties.lastModified ?? new Date(),
				});
			}
		}

		return results;
	}

	async read(remotePath: string): Promise<Readable> {
		const blobName = normalizePath(remotePath);
		const blob = this.container.getBlobClient(blobName);
		const download = await blob.download();
		if (!download.readableStreamBody) {
			throw new Error(`Failed to download blob: ${blobName}`);
		}
		return download.readableStreamBody as unknown as Readable;
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		const blobName = normalizePath(remotePath);
		const blockBlob = this.container.getBlockBlobClient(blobName);
		const chunks: Buffer[] = [];
		for await (const chunk of data) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const buffer = Buffer.concat(chunks);
		await blockBlob.upload(buffer, buffer.length);
	}

	async delete(remotePath: string): Promise<void> {
		const blobName = normalizePath(remotePath);
		const blob = this.container.getBlobClient(blobName);
		await blob.delete();
	}

	async exists(remotePath: string): Promise<boolean> {
		const blobName = normalizePath(remotePath);
		const blob = this.container.getBlobClient(blobName);
		return blob.exists();
	}

	private buildClient(extra: AzureStorageExtra, config: ConnectorConfig): BlobServiceClient {
		switch (extra.authType) {
			case "connection_string": {
				if (!config.password) throw new Error("Connection string is required");
				return BlobServiceClient.fromConnectionString(config.password);
			}

			case "account_key": {
				if (!extra.accountName || !config.password) {
					throw new Error("Account name and access key are required");
				}
				const cred = new StorageSharedKeyCredential(extra.accountName, config.password);
				return new BlobServiceClient(`https://${extra.accountName}.blob.core.windows.net`, cred);
			}

			case "sas_token": {
				if (!extra.accountName || !config.password) {
					throw new Error("Account name and SAS token are required");
				}
				const sas = config.password.startsWith("?") ? config.password : `?${config.password}`;
				return new BlobServiceClient(`https://${extra.accountName}.blob.core.windows.net${sas}`);
			}

			case "azure_ad": {
				if (!extra.tenantId || !extra.clientId || !config.password) {
					throw new Error("Tenant ID, Client ID, and Client Secret are required");
				}
				const credential = new ClientSecretCredential(extra.tenantId, extra.clientId, config.password);
				const accountName = extra.accountName ?? config.host;
				return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
			}

			default:
				throw new Error(`Unknown Azure auth type: ${extra.authType}`);
		}
	}
}

function normalizePath(p: string): string {
	return p.replace(/^\/+/, "");
}

function trimPrefix(name: string, prefix: string): string {
	if (name.startsWith(prefix)) return name.slice(prefix.length);
	return name;
}
