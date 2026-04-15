import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api/client";
import type { ConnectionType, CreateConnectionInput } from "@/types";

interface Props {
	open: boolean;
	onClose: () => void;
}

const TYPES: { value: ConnectionType; label: string }[] = [
	{ value: "sftp", label: "SFTP" },
	{ value: "local", label: "Local folder" },
];

const EMPTY: CreateConnectionInput = { name: "", type: "sftp", host: "", port: 22 };

export function ConnectionForm({ open, onClose }: Props) {
	const qc = useQueryClient();
	const [form, setForm] = useState<CreateConnectionInput>(EMPTY);
	const [error, setError] = useState<string | null>(null);

	const createMut = useMutation({
		mutationFn: api.createConnection,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["connections"] });
			setForm(EMPTY);
			setError(null);
			onClose();
		},
		onError: (err: Error) => setError(err.message),
	});

	const isLocal = form.type === "local";

	function submit() {
		setError(null);
		const payload: CreateConnectionInput = { name: form.name, type: form.type, host: form.host };
		if (!isLocal) {
			if (form.port) payload.port = Number(form.port);
			if (form.username) payload.username = form.username;
			if (form.password) payload.password = form.password;
		}
		createMut.mutate(payload);
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Connection</DialogTitle>
					<DialogDescription>Configure a server or local folder to move files to or from.</DialogDescription>
				</DialogHeader>
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
						<Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ConnectionType })}>
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
					<div className="space-y-1.5">
						<Label htmlFor="conn-host">{isLocal ? "Absolute folder path" : "Host"}</Label>
						<Input
							id="conn-host"
							required
							value={form.host}
							onChange={(e) => setForm({ ...form, host: e.target.value })}
							placeholder={isLocal ? "C:/Users/you/transfers" : "sftp.example.com"}
						/>
					</div>
					{!isLocal && (
						<>
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
								<Label htmlFor="conn-pass">Password</Label>
								<Input
									id="conn-pass"
									type="password"
									value={form.password ?? ""}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
								/>
							</div>
						</>
					)}
					{error && <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
				</form>
				<DialogFooter>
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" form="connection-form" disabled={createMut.isPending}>
						{createMut.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
