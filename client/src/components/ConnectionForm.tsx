import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import { api } from "../api/client";
import type { ConnectionType, CreateConnectionInput } from "../types";

interface Props {
	open: boolean;
	onClose: () => void;
}

const TYPES: { value: ConnectionType; label: string }[] = [
	{ value: "sftp", label: "SFTP" },
	{ value: "local", label: "Local folder" },
];

export function ConnectionForm({ open, onClose }: Props) {
	const qc = useQueryClient();
	const [form, setForm] = useState<CreateConnectionInput>({ name: "", type: "sftp", host: "", port: 22 });
	const [error, setError] = useState<string | null>(null);

	const createMut = useMutation({
		mutationFn: api.createConnection,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["connections"] });
			setForm({ name: "", type: "sftp", host: "", port: 22 });
			setError(null);
			onClose();
		},
		onError: (err: Error) => setError(err.message),
	});

	const isLocal = form.type === "local";

	function submit(e: React.FormEvent) {
		e.preventDefault();
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
		<Modal
			open={open}
			onClose={onClose}
			title="New Connection"
			footer={
				<>
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
					>
						Cancel
					</button>
					<button
						type="submit"
						form="connection-form"
						disabled={createMut.isPending}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
					>
						{createMut.isPending ? "Saving..." : "Save"}
					</button>
				</>
			}
		>
			<form id="connection-form" onSubmit={submit} className="space-y-3">
				<Field label="Name">
					<input
						required
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						className={inputCls}
						placeholder="My SFTP server"
					/>
				</Field>
				<Field label="Type">
					<select
						value={form.type}
						onChange={(e) => setForm({ ...form, type: e.target.value as ConnectionType })}
						className={inputCls}
					>
						{TYPES.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</select>
				</Field>
				<Field label={isLocal ? "Absolute folder path" : "Host"}>
					<input
						required
						value={form.host}
						onChange={(e) => setForm({ ...form, host: e.target.value })}
						className={inputCls}
						placeholder={isLocal ? "C:/Users/you/transfers" : "sftp.example.com"}
					/>
				</Field>
				{!isLocal && (
					<>
						<Field label="Port">
							<input
								type="number"
								value={form.port ?? ""}
								onChange={(e) => setForm({ ...form, port: e.target.value ? Number(e.target.value) : undefined })}
								className={inputCls}
								placeholder="22"
							/>
						</Field>
						<Field label="Username">
							<input
								value={form.username ?? ""}
								onChange={(e) => setForm({ ...form, username: e.target.value })}
								className={inputCls}
							/>
						</Field>
						<Field label="Password">
							<input
								type="password"
								value={form.password ?? ""}
								onChange={(e) => setForm({ ...form, password: e.target.value })}
								className={inputCls}
							/>
						</Field>
					</>
				)}
				{error && <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}
			</form>
		</Modal>
	);
}

const inputCls =
	"w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="block">
			<span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
			{children}
		</label>
	);
}
