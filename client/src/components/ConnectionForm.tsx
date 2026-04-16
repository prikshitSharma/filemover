import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api/client";
import type { ConnectionType, CreateConnectionInput, SharePointAuthType, AzureStorageAuthType } from "@/types";

interface Props {
	open: boolean;
	onClose: () => void;
}

const TYPES: { value: ConnectionType; label: string }[] = [
	{ value: "sftp", label: "SFTP" },
	{ value: "ftp", label: "FTP / FTPS" },
	{ value: "smb", label: "SMB / Windows Share" },
	{ value: "sharepoint", label: "SharePoint" },
	{ value: "azure-storage", label: "Azure Blob Storage" },
	{ value: "local", label: "Local folder" },
];

type SftpAuthMethod = "password" | "key";

const SP_AUTH_TYPES: { value: SharePointAuthType; label: string }[] = [
	{ value: "client_secret", label: "Client Secret (App-Only)" },
	{ value: "client_certificate", label: "Client Certificate" },
	{ value: "password", label: "Username & Password (ROPC)" },
];

const AZ_AUTH_TYPES: { value: AzureStorageAuthType; label: string }[] = [
	{ value: "connection_string", label: "Connection String" },
	{ value: "account_key", label: "Account Key" },
	{ value: "sas_token", label: "SAS Token" },
	{ value: "azure_ad", label: "Azure AD (Client Credentials)" },
];

const EMPTY: CreateConnectionInput = { name: "", type: "sftp", host: "", port: 22 };

export function ConnectionForm({ open, onClose }: Props) {
	const qc = useQueryClient();
	const [form, setForm] = useState<CreateConnectionInput>(EMPTY);
	const [sftpAuth, setSftpAuth] = useState<SftpAuthMethod>("password");
	const [spAuth, setSpAuth] = useState<SharePointAuthType>("client_secret");
	const [spTenantId, setSpTenantId] = useState("");
	const [spClientId, setSpClientId] = useState("");
	const [spSiteUrl, setSpSiteUrl] = useState("");
	const [spDriveId, setSpDriveId] = useState("");
	const [azAuth, setAzAuth] = useState<AzureStorageAuthType>("connection_string");
	const [azAccountName, setAzAccountName] = useState("");
	const [azContainer, setAzContainer] = useState("");
	const [azTenantId, setAzTenantId] = useState("");
	const [azClientId, setAzClientId] = useState("");
	const [keyFile, setKeyFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createMut = useMutation({
		mutationFn: api.createConnection,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["connections"] });
			resetState();
			onClose();
		},
		onError: (err: Error) => setError(err.message),
	});

	const isLocal = form.type === "local";
	const isSftp = form.type === "sftp";
	const isFtp = form.type === "ftp";
	const isSmb = form.type === "smb";
	const isSharePoint = form.type === "sharepoint";
	const isAzure = form.type === "azure-storage";
	const [ftpSecure, setFtpSecure] = useState(false);
	const [smbShare, setSmbShare] = useState("");
	const [smbDomain, setSmbDomain] = useState("");

	function resetState() {
		setForm(EMPTY);
		setSftpAuth("password");
		setSpAuth("client_secret");
		setSpTenantId("");
		setSpClientId("");
		setSpSiteUrl("");
		setSpDriveId("");
		setAzAuth("connection_string");
		setAzAccountName("");
		setAzContainer("");
		setAzTenantId("");
		setAzClientId("");
		setFtpSecure(false);
		setSmbShare("");
		setSmbDomain("");
		setKeyFile(null);
		setError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function submit() {
		setError(null);
		const payload: CreateConnectionInput = { name: form.name, type: form.type, host: form.host };

		if (isSftp) {
			if (form.port) payload.port = Number(form.port);
			if (form.username) payload.username = form.username;
			if (sftpAuth === "password") {
				if (form.password) payload.password = form.password;
			} else {
				if (!keyFile) {
					setError("Please choose a private key file.");
					return;
				}
				setUploading(true);
				try {
					const { keyPath } = await api.uploadKey(keyFile);
					payload.keyPath = keyPath;
					if (form.passphrase) payload.passphrase = form.passphrase;
				} catch (err) {
					setUploading(false);
					setError(err instanceof Error ? err.message : String(err));
					return;
				}
				setUploading(false);
			}
		}

		if (isFtp) {
			if (form.port) payload.port = Number(form.port);
			if (form.username) payload.username = form.username;
			if (form.password) payload.password = form.password;
			if (ftpSecure) payload.extra = { secure: true };
		}

		if (isSmb) {
			if (form.port) payload.port = Number(form.port);
			if (form.username) payload.username = form.username;
			if (form.password) payload.password = form.password;
			if (!smbShare) { setError("Share name is required."); return; }
			payload.extra = {
				shareName: smbShare,
				...(smbDomain ? { domain: smbDomain } : {}),
			};
		}

		if (isSharePoint) {
			if (!spTenantId || !spClientId || !spSiteUrl) {
				setError("Tenant ID, Client ID, and Site URL are required.");
				return;
			}
			payload.host = spSiteUrl;
			payload.extra = {
				authType: spAuth,
				tenantId: spTenantId,
				clientId: spClientId,
				siteUrl: spSiteUrl,
				...(spDriveId ? { driveId: spDriveId } : {}),
			};

			if (spAuth === "client_secret") {
				if (!form.password) { setError("Client secret is required."); return; }
				payload.password = form.password;
			} else if (spAuth === "client_certificate") {
				if (!keyFile) { setError("Please choose a certificate file."); return; }
				setUploading(true);
				try {
					const { keyPath } = await api.uploadKey(keyFile);
					payload.extra.certificatePath = keyPath;
				} catch (err) {
					setUploading(false);
					setError(err instanceof Error ? err.message : String(err));
					return;
				}
				setUploading(false);
			} else {
				if (!form.username || !form.password) { setError("Username and password are required."); return; }
				payload.username = form.username;
				payload.password = form.password;
			}
		}

		if (isAzure) {
			if (!azContainer) { setError("Container name is required."); return; }
			payload.host = azAccountName || "azure";
			payload.extra = {
				authType: azAuth,
				containerName: azContainer,
				...(azAccountName ? { accountName: azAccountName } : {}),
				...(azAuth === "azure_ad" ? { tenantId: azTenantId, clientId: azClientId } : {}),
			};
			if (!form.password) {
				const labels: Record<string, string> = {
					connection_string: "Connection string",
					account_key: "Access key",
					sas_token: "SAS token",
					azure_ad: "Client secret",
				};
				setError(`${labels[azAuth]} is required.`);
				return;
			}
			payload.password = form.password;
			if (azAuth === "azure_ad" && (!azTenantId || !azClientId)) {
				setError("Tenant ID and Client ID are required for Azure AD auth.");
				return;
			}
		}

		createMut.mutate(payload);
	}

	const saving = uploading || createMut.isPending;

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) {
					resetState();
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Connection</DialogTitle>
					<DialogDescription>Configure a server or local folder to move files to or from.</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<form
						id="connection-form"
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="space-y-3"
					>
					<div className="space-y-1.5">
						<Label htmlFor="conn-name">Name</Label>
						<Input
							id="conn-name"
							required
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="My SFTP server"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="conn-type">Type</Label>
						<Select
							value={form.type}
							onValueChange={(v) => {
								const newType = v as ConnectionType;
								setForm({ ...form, type: newType, host: "", port: newType === "sftp" ? 22 : undefined });
							}}
						>
							<SelectTrigger id="conn-type" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TYPES.map((t) => (
									<SelectItem key={t.value} value={t.value}>
										{t.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* ---------- LOCAL ---------- */}
					{isLocal && (
						<div className="space-y-1.5">
							<Label htmlFor="conn-host">Absolute folder path</Label>
							<Input
								id="conn-host"
								required
								value={form.host}
								onChange={(e) => setForm({ ...form, host: e.target.value })}
								placeholder="C:/Users/you/transfers"
							/>
						</div>
					)}

					{/* ---------- SFTP ---------- */}
					{isSftp && (
						<>
							<div className="space-y-1.5">
								<Label htmlFor="conn-host">Host</Label>
								<Input
									id="conn-host"
									required
									value={form.host}
									onChange={(e) => setForm({ ...form, host: e.target.value })}
									placeholder="sftp.example.com"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="conn-port">Port</Label>
								<Input
									id="conn-port"
									type="number"
									value={form.port ?? ""}
									onChange={(e) => setForm({ ...form, port: e.target.value ? Number(e.target.value) : undefined })}
									placeholder="22"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="conn-user">Username</Label>
								<Input id="conn-user" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="conn-auth">Authentication</Label>
								<Select value={sftpAuth} onValueChange={(v) => setSftpAuth(v as SftpAuthMethod)}>
									<SelectTrigger id="conn-auth" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="password">Password</SelectItem>
										<SelectItem value="key">Private key</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{sftpAuth === "password" ? (
								<div className="space-y-1.5">
									<Label htmlFor="conn-pass">Password</Label>
									<Input
										id="conn-pass"
										type="password"
										value={form.password ?? ""}
										onChange={(e) => setForm({ ...form, password: e.target.value })}
									/>
								</div>
							) : (
								<>
									<div className="space-y-1.5">
										<Label htmlFor="conn-key">Private key file</Label>
										<Input
											id="conn-key"
											ref={fileInputRef}
											type="file"
											accept=".pem,.ppk,.key,.openssh,application/x-pem-file"
											onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)}
										/>
										{keyFile && <p className="text-xs text-muted-foreground">{keyFile.name} ({keyFile.size} bytes)</p>}
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="conn-passphrase">Passphrase (optional)</Label>
										<Input
											id="conn-passphrase"
											type="password"
											value={form.passphrase ?? ""}
											onChange={(e) => setForm({ ...form, passphrase: e.target.value })}
											placeholder="Leave blank if key is unencrypted"
										/>
									</div>
								</>
							)}
						</>
					)}

					{/* ---------- FTP ---------- */}
					{isFtp && (
						<>
							<div className="space-y-1.5">
								<Label htmlFor="ftp-host">Host</Label>
								<Input
									id="ftp-host"
									required
									value={form.host}
									onChange={(e) => setForm({ ...form, host: e.target.value })}
									placeholder="ftp.example.com"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="ftp-port">Port</Label>
								<Input
									id="ftp-port"
									type="number"
									value={form.port ?? ""}
									onChange={(e) => setForm({ ...form, port: e.target.value ? Number(e.target.value) : undefined })}
									placeholder="21"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="ftp-user">Username</Label>
								<Input
									id="ftp-user"
									value={form.username ?? ""}
									onChange={(e) => setForm({ ...form, username: e.target.value })}
									placeholder="anonymous"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="ftp-pass">Password</Label>
								<Input
									id="ftp-pass"
									type="password"
									value={form.password ?? ""}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
								/>
							</div>
							<label className="flex items-center gap-2 text-sm cursor-pointer">
								<input
									type="checkbox"
									checked={ftpSecure}
									onChange={(e) => setFtpSecure(e.target.checked)}
									className="rounded border-border"
								/>
								Use FTPS (TLS/SSL)
							</label>
						</>
					)}

					{/* ---------- SMB ---------- */}
					{isSmb && (
						<>
							<div className="space-y-1.5">
								<Label htmlFor="smb-host">Host / IP</Label>
								<Input
									id="smb-host"
									required
									value={form.host}
									onChange={(e) => setForm({ ...form, host: e.target.value })}
									placeholder="192.168.1.100 or fileserver"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="smb-share">Share name</Label>
									<Input
										id="smb-share"
										required
										value={smbShare}
										onChange={(e) => setSmbShare(e.target.value)}
										placeholder="SharedDocs"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="smb-port">Port</Label>
									<Input
										id="smb-port"
										type="number"
										value={form.port ?? ""}
										onChange={(e) => setForm({ ...form, port: e.target.value ? Number(e.target.value) : undefined })}
										placeholder="445"
									/>
								</div>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="smb-domain">Domain (optional)</Label>
								<Input
									id="smb-domain"
									value={smbDomain}
									onChange={(e) => setSmbDomain(e.target.value)}
									placeholder="WORKGROUP"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="smb-user">Username</Label>
								<Input
									id="smb-user"
									value={form.username ?? ""}
									onChange={(e) => setForm({ ...form, username: e.target.value })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="smb-pass">Password</Label>
								<Input
									id="smb-pass"
									type="password"
									value={form.password ?? ""}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
								/>
							</div>
						</>
					)}

					{/* ---------- SHAREPOINT ---------- */}
					{isSharePoint && (
						<>
							<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azure AD / Entra ID</p>
								<div className="space-y-1.5">
									<Label htmlFor="sp-tenant">Tenant ID</Label>
									<Input
										id="sp-tenant"
										required
										value={spTenantId}
										onChange={(e) => setSpTenantId(e.target.value)}
										placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="sp-client">Client (App) ID</Label>
									<Input
										id="sp-client"
										required
										value={spClientId}
										onChange={(e) => setSpClientId(e.target.value)}
										placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="sp-auth-type">Authentication method</Label>
									<Select value={spAuth} onValueChange={(v) => setSpAuth(v as SharePointAuthType)}>
										<SelectTrigger id="sp-auth-type" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SP_AUTH_TYPES.map((t) => (
												<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{spAuth === "client_secret" && (
									<div className="space-y-1.5">
										<Label htmlFor="sp-secret">Client Secret</Label>
										<Input
											id="sp-secret"
											type="password"
											value={form.password ?? ""}
											onChange={(e) => setForm({ ...form, password: e.target.value })}
										/>
									</div>
								)}
								{spAuth === "client_certificate" && (
									<div className="space-y-1.5">
										<Label htmlFor="sp-cert">Certificate file (.pem)</Label>
										<Input
											id="sp-cert"
											ref={fileInputRef}
											type="file"
											accept=".pem,.pfx,.p12"
											onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)}
										/>
										{keyFile && <p className="text-xs text-muted-foreground">{keyFile.name}</p>}
									</div>
								)}
								{spAuth === "password" && (
									<>
										<div className="space-y-1.5">
											<Label htmlFor="sp-user">Username (email)</Label>
											<Input
												id="sp-user"
												type="email"
												value={form.username ?? ""}
												onChange={(e) => setForm({ ...form, username: e.target.value })}
												placeholder="user@contoso.com"
											/>
										</div>
										<div className="space-y-1.5">
											<Label htmlFor="sp-pass">Password</Label>
											<Input
												id="sp-pass"
												type="password"
												value={form.password ?? ""}
												onChange={(e) => setForm({ ...form, password: e.target.value })}
											/>
										</div>
									</>
								)}
							</div>
							<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SharePoint Site</p>
								<div className="space-y-1.5">
									<Label htmlFor="sp-site">Site URL</Label>
									<Input
										id="sp-site"
										required
										value={spSiteUrl}
										onChange={(e) => setSpSiteUrl(e.target.value)}
										placeholder="https://contoso.sharepoint.com/sites/mysite"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="sp-drive">Drive / Library ID (optional)</Label>
									<Input
										id="sp-drive"
										value={spDriveId}
										onChange={(e) => setSpDriveId(e.target.value)}
										placeholder="Leave blank to use the default document library"
									/>
								</div>
							</div>
						</>
					)}

					{/* ---------- AZURE STORAGE ---------- */}
					{isAzure && (
						<>
							<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Authentication</p>
								<div className="space-y-1.5">
									<Label htmlFor="az-auth-type">Auth method</Label>
									<Select value={azAuth} onValueChange={(v) => setAzAuth(v as AzureStorageAuthType)}>
										<SelectTrigger id="az-auth-type" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{AZ_AUTH_TYPES.map((t) => (
												<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{azAuth !== "connection_string" && (
									<div className="space-y-1.5">
										<Label htmlFor="az-account">Storage account name</Label>
										<Input
											id="az-account"
											required
											value={azAccountName}
											onChange={(e) => setAzAccountName(e.target.value)}
											placeholder="mystorageaccount"
										/>
									</div>
								)}
								{azAuth === "azure_ad" && (
									<>
										<div className="space-y-1.5">
											<Label htmlFor="az-tenant">Tenant ID</Label>
											<Input
												id="az-tenant"
												required
												value={azTenantId}
												onChange={(e) => setAzTenantId(e.target.value)}
												placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
											/>
										</div>
										<div className="space-y-1.5">
											<Label htmlFor="az-client">Client (App) ID</Label>
											<Input
												id="az-client"
												required
												value={azClientId}
												onChange={(e) => setAzClientId(e.target.value)}
												placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
											/>
										</div>
									</>
								)}
								<div className="space-y-1.5">
									<Label htmlFor="az-secret">
										{azAuth === "connection_string" ? "Connection string"
											: azAuth === "account_key" ? "Access key"
											: azAuth === "sas_token" ? "SAS token"
											: "Client secret"}
									</Label>
									<Input
										id="az-secret"
										type="password"
										value={form.password ?? ""}
										onChange={(e) => setForm({ ...form, password: e.target.value })}
									/>
								</div>
							</div>
							<div className="rounded-lg border bg-muted/30 p-3 space-y-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Container</p>
								<div className="space-y-1.5">
									<Label htmlFor="az-container">Container name</Label>
									<Input
										id="az-container"
										required
										value={azContainer}
										onChange={(e) => setAzContainer(e.target.value)}
										placeholder="my-container"
									/>
								</div>
							</div>
						</>
					)}

					{error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}
					</form>
				</DialogBody>
				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							resetState();
							onClose();
						}}
					>
						Cancel
					</Button>
					<Button type="submit" form="connection-form" disabled={saving}>
						{uploading ? "Uploading..." : createMut.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
