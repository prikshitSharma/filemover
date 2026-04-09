import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, Server } from "lucide-react";

export function Connections() {
	const { data: connections, isLoading } = useQuery({
		queryKey: ["connections"],
		queryFn: api.getConnections,
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Connections</h2>
				<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
					<Plus className="w-4 h-4" />
					New Connection
				</button>
			</div>

			{isLoading ? (
				<div className="text-gray-500">Loading connections...</div>
			) : !connections || (connections as unknown[]).length === 0 ? (
				<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
					<Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
					<p className="text-gray-500 text-sm">Add your first SFTP, FTP, or other connection to get started.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{(connections as Record<string, unknown>[]).map((conn) => (
						<div key={String(conn.id)} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
							<div className="flex items-center gap-3 mb-3">
								<Server className="w-5 h-5 text-blue-600" />
								<h3 className="font-semibold text-gray-900">{String(conn.name)}</h3>
							</div>
							<p className="text-sm text-gray-500">
								<span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium uppercase mr-2">
									{String(conn.type)}
								</span>
								{String(conn.host)}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
