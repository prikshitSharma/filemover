import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ScrollText, CheckCircle, XCircle, Clock } from "lucide-react";
import type { TransferLog } from "../types";

const statusIcons: Record<string, React.ReactNode> = {
	completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
	failed: <XCircle className="w-4 h-4 text-destructive" />,
	transferring: <Clock className="w-4 h-4 text-amber-500" />,
	pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export function Transfers() {
	const { data, isLoading } = useQuery({
		queryKey: ["transfers"],
		queryFn: () => api.getTransfers(),
		refetchInterval: 3000,
	});

	const transfers = data?.transfers;

	return (
		<div>
			<h2 className="text-2xl font-bold tracking-tight mb-1">Transfer Logs</h2>
			<p className="text-sm text-muted-foreground mb-6">Audit trail of all file transfers.</p>

			{isLoading ? (
				<div className="text-muted-foreground">Loading transfers...</div>
			) : !transfers || transfers.length === 0 ? (
				<div className="bg-card text-card-foreground rounded-xl border p-12 text-center shadow-sm">
					<ScrollText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
					<h3 className="text-lg font-medium mb-2">No transfers yet</h3>
					<p className="text-muted-foreground text-sm">Transfer logs will appear here once jobs start running.</p>
				</div>
			) : (
				<div className="bg-card text-card-foreground rounded-xl border overflow-hidden shadow-sm">
					<table className="w-full text-sm">
						<thead className="bg-muted/50 border-b">
							<tr>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">File</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Job</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Size</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Duration</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Started</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{transfers.map((t: TransferLog) => (
								<tr key={t.id} className="hover:bg-muted/30 transition-colors">
									<td className="px-4 py-3">{statusIcons[t.status] ?? t.status}</td>
									<td className="px-4 py-3">
										{t.fileName}
										{t.errorMessage && <div className="text-xs text-destructive mt-0.5">{t.errorMessage}</div>}
									</td>
									<td className="px-4 py-3 text-muted-foreground">{t.job?.name}</td>
									<td className="px-4 py-3 text-muted-foreground">{t.fileSize != null ? formatBytes(t.fileSize) : "—"}</td>
									<td className="px-4 py-3 text-muted-foreground">{t.duration != null ? `${t.duration} ms` : "—"}</td>
									<td className="px-4 py-3 text-muted-foreground">{new Date(t.startedAt).toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
