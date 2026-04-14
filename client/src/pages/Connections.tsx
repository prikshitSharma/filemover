import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, Server, Trash2, CheckCircle, XCircle } from "lucide-react";
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
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Connections</h2>
				<button
					onClick={() => setFormOpen(true)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
				>
					<Plus className="w-4 h-4" />
					New Connection
				</button>
			</div>

			{isLoading ? (
				<div className="text-gray-500">Loading connections...</div>
			) : !connections || connections.length === 0 ? (
				<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
					<Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
					<p className="text-gray-500 text-sm">Add your first SFTP, FTP, or other connection to get started.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{connections.map((conn: Connection) => {
						const result = testResult[conn.id];
						return (
							<div key={conn.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-3">
										<Server className="w-5 h-5 text-blue-600" />
										<h3 className="font-semibold text-gray-900">{conn.name}</h3>
									</div>
									<button
										onClick={() => {
											if (confirm(`Delete connection "${conn.name}"?`)) deleteMut.mutate(conn.id);
										}}
										className="text-gray-400 hover:text-red-600"
										title="Delete"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
								<p className="text-sm text-gray-500 mb-3">
									<span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium uppercase mr-2">
										{conn.type}
									</span>
									<span className="break-all">{conn.host}</span>
								</p>
								<div className="flex items-center gap-2">
									<button
										onClick={() => testMut.mutate(conn.id)}
										disabled={testMut.isPending && testMut.variables === conn.id}
										className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
									>
										{testMut.isPending && testMut.variables === conn.id ? "Testing..." : "Test"}
									</button>
									{result?.ok && (
										<span className="flex items-center gap-1 text-xs text-green-700">
											<CheckCircle className="w-3 h-3" /> OK
										</span>
									)}
									{result && !result.ok && (
										<span className="flex items-center gap-1 text-xs text-red-700" title={result.error}>
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
