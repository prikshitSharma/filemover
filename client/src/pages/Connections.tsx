import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, Server, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionForm } from "../components/ConnectionForm";
import type { Connection } from "../types";

export function Connections() {
	const qc = useQueryClient();
	const [formOpen, setFormOpen] = useState(false);
	const [testResult, setTestResult] = useState<Record<string, { ok: boolean; error?: string }>>({});

	const { data: connections, isLoading } = useQuery({
		queryKey: ["connections"],
		queryFn: api.getConnections,
	});

	const deleteMut = useMutation({
		mutationFn: api.deleteConnection,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["connections"] }),
	});

	const testMut = useMutation({
		mutationFn: api.testConnection,
		onSuccess: (data, id) => setTestResult((prev) => ({ ...prev, [id]: data })),
		onError: (err: Error, id) => setTestResult((prev) => ({ ...prev, [id]: { ok: false, error: err.message } })),
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-1">
				<h2 className="text-2xl font-bold tracking-tight">Connections</h2>
				<Button onClick={() => setFormOpen(true)} size="sm">
					<Plus className="w-4 h-4 mr-1.5" />
					New Connection
				</Button>
			</div>
			<p className="text-sm text-muted-foreground mb-6">Manage your SFTP, FTP, and local folder connections.</p>

			{isLoading ? (
				<div className="text-muted-foreground">Loading connections...</div>
			) : !connections || connections.length === 0 ? (
				<div className="bg-card text-card-foreground rounded-xl border p-12 text-center shadow-sm">
					<Server className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
					<h3 className="text-lg font-medium mb-2">No connections yet</h3>
					<p className="text-muted-foreground text-sm">Add your first SFTP, FTP, or other connection to get started.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{connections.map((conn: Connection) => {
						const result = testResult[conn.id];
						return (
							<div key={conn.id} className="bg-card text-card-foreground rounded-xl border p-5 hover:shadow-md transition-shadow shadow-sm">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
											<Server className="w-4 h-4" />
										</div>
										<h3 className="font-semibold">{conn.name}</h3>
									</div>
									<button
										onClick={() => {
											if (confirm(`Delete connection "${conn.name}"?`)) deleteMut.mutate(conn.id);
										}}
										className="text-muted-foreground/50 hover:text-destructive transition-colors"
										title="Delete"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
								<p className="text-sm text-muted-foreground mb-3">
									<span className="inline-block px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs font-medium uppercase mr-2">
										{conn.type}
									</span>
									<span className="break-all">{conn.host}</span>
								</p>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => testMut.mutate(conn.id)}
										disabled={testMut.isPending && testMut.variables === conn.id}
									>
										{testMut.isPending && testMut.variables === conn.id ? "Testing..." : "Test"}
									</Button>
									{result?.ok && (
										<span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
											<CheckCircle className="w-3 h-3" /> OK
										</span>
									)}
									{result && !result.ok && (
										<span className="flex items-center gap-1 text-xs text-destructive" title={result.error}>
											<XCircle className="w-3 h-3" /> Failed
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<ConnectionForm open={formOpen} onClose={() => setFormOpen(false)} />
		</div>
	);
}
