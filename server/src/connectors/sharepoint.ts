import { Readable } from "stream";
import { Client } from "@microsoft/microsoft-graph-client";
import {
	ClientSecretCredential,
	ClientCertificateCredential,
	UsernamePasswordCredential,
} from "@azure/identity";
import type { ConnectorConfig, FileConnector, FileInfo } from "./base";

type SharePointAuthType = "client_secret" | "client_certificate" | "password";

interface SharePointExtra {
	authType: SharePointAuthType;
	tenantId: string;
	clientId: string;
	siteUrl: string;
	driveId?: string;
	certificatePath?: string;
}

export class SharePointConnector implements FileConnector {
	readonly type = "sharepoint";
	private client!: Client;
	private driveId!: string;
	private siteId!: string;

	async connect(config: ConnectorConfig): Promise<void> {
		const extra = config.extra as unknown as SharePointExtra;
		if (!extra?.tenantId || !extra?.clientId || !extra?.siteUrl) {
			throw new Error("SharePoint requires tenantId, clientId, and siteUrl in extra config");
		}

		const credential = this.buildCredential(extra, config);
		const tokenProvider = {
			getAccessToken: async () => {
				const token = await credential.getToken("https://graph.microsoft.com/.default");
				return token.token;
			},
		};

		this.client = Client.initWithMiddleware({
			authProvider: { getAccessToken: () => tokenProvider.getAccessToken() },
		});

		this.siteId = await this.resolveSiteId(extra.siteUrl);

		if (extra.driveId) {
			this.driveId = extra.driveId;
		} else {
			const drives = await this.client
				.api(`/sites/${this.siteId}/drives`)
				.select("id,name")
				.get();
			if (!drives.value?.length) {
				throw new Error("No document libraries found on this SharePoint site");
			}
			this.driveId = drives.value[0].id;
		}
	}

	async disconnect(): Promise<void> {
		// Graph client is stateless — nothing to close
	}

	async list(remotePath: string): Promise<FileInfo[]> {
		const apiPath = this.itemPath(remotePath, true);
		const result = await this.client
			.api(apiPath)
			.select("id,name,size,folder,file,lastModifiedDateTime,parentReference")
			.get();

		return (result.value ?? []).map((item: GraphDriveItem) => ({
			name: item.name,
			path: joinPath(remotePath, item.name),
			size: item.size ?? 0,
			isDirectory: !!item.folder,
			modifiedAt: new Date(item.lastModifiedDateTime),
		}));
	}

	async read(remotePath: string): Promise<Readable> {
		const apiPath = this.itemPath(remotePath) + "/content";
		const stream = await this.client.api(apiPath).getStream();
		return Readable.fromWeb(stream as import("stream/web").ReadableStream);
	}

	async write(remotePath: string, data: Readable): Promise<void> {
		const chunks: Buffer[] = [];
		for await (const chunk of data) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const buffer = Buffer.concat(chunks);

		const apiPath = this.itemPath(remotePath) + "/content";
		await this.client
			.api(apiPath)
			.putStream(Readable.from(buffer));
	}

	async delete(remotePath: string): Promise<void> {
		const apiPath = this.itemPath(remotePath);
		await this.client.api(apiPath).delete();
	}

	async exists(remotePath: string): Promise<boolean> {
		try {
			const apiPath = this.itemPath(remotePath);
			await this.client.api(apiPath).select("id").get();
			return true;
		} catch (err: unknown) {
			if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 404) {
				return false;
			}
			throw err;
		}
	}

	private buildCredential(extra: SharePointExtra, config: ConnectorConfig) {
		switch (extra.authType) {
			case "client_secret":
				if (!config.password) throw new Error("Client secret is required (stored in password field)");
				return new ClientSecretCredential(extra.tenantId, extra.clientId, config.password);

			case "client_certificate": {
				const certPath = extra.certificatePath ?? config.keyPath;
				if (!certPath) throw new Error("Certificate path is required");
				return new ClientCertificateCredential(extra.tenantId, extra.clientId, certPath);
			}

			case "password":
				if (!config.username || !config.password) {
					throw new Error("Username and password are required for password auth");
				}
				return new UsernamePasswordCredential(
					extra.tenantId,
					extra.clientId,
					config.username,
					config.password,
				);

			default:
				throw new Error(`Unknown SharePoint auth type: ${extra.authType}`);
		}
	}

	private async resolveSiteId(siteUrl: string): Promise<string> {
		const url = new URL(siteUrl);
		const hostname = url.hostname;
		const sitePath = url.pathname.replace(/^\//, "").replace(/\/$/, "");

		const site = await this.client
			.api(`/sites/${hostname}:/${sitePath}`)
			.select("id")
			.get();
		return site.id;
	}

	private itemPath(remotePath: string, children = false): string {
		const clean = remotePath.replace(/^\/+|\/+$/g, "");
		const base = `/drives/${this.driveId}`;
		if (!clean || clean === "/") {
			return children ? `${base}/root/children` : `${base}/root`;
		}
		const suffix = children ? ":/children" : "";
		return `${base}/root:/${clean}${suffix}`;
	}
}

interface GraphDriveItem {
	id: string;
	name: string;
	size?: number;
	folder?: object;
	file?: object;
	lastModifiedDateTime: string;
	parentReference?: { path?: string };
}

function joinPath(dir: string, name: string): string {
	if (dir.endsWith("/")) return dir + name;
	return dir + "/" + name;
}