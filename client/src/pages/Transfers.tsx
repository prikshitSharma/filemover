import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ScrollText, CheckCircle, XCircle, Clock } from "lucide-react";

const statusIcons: Record<string, React.ReactNode> = {
	completed: <CheckCircle className="w-4 h-4 text-green-600" />,
	failed: <XCircle className="w-4 h-4 text-red-600" />,
	transferring: <Clock className="w-4 h-4 text-yellow-600" />,
	pending: <Clock className="w-4 h-4 text-gray-400" />,
};

export function Transfers() {
	const { data, isLoading } = useQuery({
		queryKey: ["transfers"],
		queryFn: () => api.getTransfers(),
	});

	const transfers = (data as { transfers: Record<string, unknown>[]; total: number } | undefined)?.transfers;

	return (
		<div>
			<h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer Logs</h2>

			{isLoading ? (
				<div className="text-gray-500">Loading transfers...</div>
			) : !transfers || transfers.length === 0 ? (
				<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
					<ScrollText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No transfers yet</h3>
					<p className="text-gray-500 text-sm">Transfer logs will appear here once jobs start running.</p>
				</div>
			) : (
				<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
								<th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
								<th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
								<th className="text-left px-4 py-3 font-medium text-gray-600">Started</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{transfers.map((t) => (
								<tr key={String(t.id)} className="hover:bg-gray-50">
									<td className="px-4 py-3">{statusIcons[String(t.status)] ?? t.status}</td>
									<td className="px-4 py-3 text-gray-900">{String(t.fileName)}</td>
									<td className="px-4 py-3 text-gray-500">{String((t.job as Record<string, unknown>)?.name)}</td>
									<td className="px-4 py-3 text-gray-500">{new Date(String(t.startedAt)).toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
