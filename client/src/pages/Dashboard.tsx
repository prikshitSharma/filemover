import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { FileBox, CheckCircle, XCircle, Activity } from "lucide-react";

export function Dashboard() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["stats"],
		queryFn: api.getStats,
	});

	if (isLoading) {
		return <div className="text-gray-500">Loading dashboard...</div>;
	}

	const s = stats as Record<string, unknown> | undefined;

	return (
		<div>
			<h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

			{/* Stats cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<StatCard
					icon={<FileBox className="w-8 h-8 text-blue-600" />}
					label="Active Jobs"
					value={String(s?.activeJobs ?? 0)}
				/>
				<StatCard
					icon={<Activity className="w-8 h-8 text-green-600" />}
					label="Total Transfers"
					value={String(s?.totalTransfers ?? 0)}
				/>
				<StatCard
					icon={<XCircle className="w-8 h-8 text-red-600" />}
					label="Failed"
					value={String(s?.failedTransfers ?? 0)}
				/>
				<StatCard
					icon={<CheckCircle className="w-8 h-8 text-emerald-600" />}
					label="Success Rate"
					value={`${s?.successRate ?? 100}%`}
				/>
			</div>

			{/* Recent transfers */}
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transfers</h3>
				<p className="text-gray-500 text-sm">No transfers yet. Create a job to get started.</p>
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
