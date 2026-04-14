import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { FileBox, CheckCircle, XCircle, Activity, Clock } from "lucide-react";
import type { TransferLog } from "../types";

const statusIcons: Record<string, React.ReactNode> = {
	completed: <CheckCircle className="w-4 h-4 text-green-600" />,
	failed: <XCircle className="w-4 h-4 text-red-600" />,
	transferring: <Clock className="w-4 h-4 text-yellow-600" />,
	pending: <Clock className="w-4 h-4 text-gray-400" />,
};

export function Dashboard() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["stats"],
		queryFn: api.getStats,
		refetchInterval: 3000,
	});

	if (isLoading) {
		return <div className="text-gray-500">Loading dashboard...</div>;
	}

	return (
		<div>
			<h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard icon={<FileBox className="w-8 h-8 text-blue-600" />} label="Active Jobs" value={String(stats?.activeJobs ?? 0)} />
				<StatCard icon={<Activity className="w-8 h-8 text-green-600" />} label="Total Transfers" value={String(stats?.totalTransfers ?? 0)} />
				<StatCard icon={<XCircle className="w-8 h-8 text-red-600" />} label="Failed" value={String(stats?.failedTransfers ?? 0)} />
				<StatCard icon={<CheckCircle className="w-8 h-8 text-emerald-600" />} label="Success Rate" value={`${stats?.successRate ?? 100}%`} />
			</div>

			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transfers</h3>
				{!stats?.recentTransfers || stats.recentTransfers.length === 0 ? (
					<p className="text-gray-500 text-sm">No transfers yet. Create a job to get started.</p>
				) : (
					<div className="space-y-2">
						{stats.recentTransfers.map((t: TransferLog) => (
							<div key={t.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
								{statusIcons[t.status] ?? t.status}
								<span className="text-gray-900 font-medium">{t.fileName}</span>
								<span className="text-gray-500">{t.job?.name}</span>
								<span className="text-gray-400 ml-auto">{new Date(t.startedAt).toLocaleString()}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center gap-4">
			{icon}
			<div>
				<p className="text-sm text-gray-500">{label}</p>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
			</div>
		</div>
	);
}
