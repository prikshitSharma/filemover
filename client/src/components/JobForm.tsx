import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import { api } from "../api/client";
import type { CreateJobInput } from "../types";

interface Props {
	open: boolean;
	onClose: () => void;
}

export function JobForm({ open, onClose }: Props) {
	const qc = useQueryClient();
	const { data: connections } = useQuery({ queryKey: ["connections"], queryFn: api.getConnections, enabled: open });
	const [form, setForm] = useState<CreateJobInput>({
		name: "",
		sourceConnectionId: "",
		sourcePath: "",
		destConnectionId: "",
		destPath: "",
		filePattern: "*",
	});
	const [error, setError] = useState<string | null>(null);

	const createMut = useMutation({
		mutationFn: api.createJob,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["jobs"] });
			setForm({ name: "", sourceConnectionId: "", sourcePath: "", destConnectionId: "", destPath: "", filePattern: "*" });
			setError(null);
			onClose();
		},
		onError: (err: Error) => setError(err.message),
	});

	function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		createMut.mutate(form);
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="New Transfer Job"
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
						form="job-form"
						disabled={createMut.isPending}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
					>
						{createMut.isPending ? "Saving..." : "Save"}
					</button>
				</>
			}
		>
			<form id="job-form" onSubmit={submit} className="space-y-3">
				<Field label="Job name">
					<input
						required
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						className={inputCls}
						placeholder="Nightly backup"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Source connection">
						<select
							required
							value={form.sourceConnectionId}
							onChange={(e) => setForm({ ...form, sourceConnectionId: e.target.value })}
							className={inputCls}
						>
							<option value="">Select...</option>
							{connections?.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} ({c.type})
								</option>
							))}
						</select>
					</Field>
					<Field label="Source path">
						<input
							required
							value={form.sourcePath}
							onChange={(e) => setForm({ ...form, sourcePath: e.target.value })}
							className={inputCls}
							placeholder="/pub/example"
						/>
					</Field>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Destination connection">
						<select
							required
							value={form.destConnectionId}
							onChange={(e) => setForm({ ...form, destConnectionId: e.target.value })}
							className={inputCls}
						>
							<option value="">Select...</option>
							{connections?.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} ({c.type})
								</option>
							))}
						</select>
					</Field>
					<Field label="Destination path">
						<input
							required
							value={form.destPath}
							onChange={(e) => setForm({ ...form, destPath: e.target.value })}
							className={inputCls}
							placeholder="/out"
						/>
					</Field>
				</div>
				<Field label="File pattern">
					<input
						value={form.filePattern ?? "*"}
						onChange={(e) => setForm({ ...form, filePattern: e.target.value })}
						className={inputCls}
						placeholder="*.txt"
					/>
				</Field>
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
