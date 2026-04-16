import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { FileBox, CheckCircle, XCircle, Activity, Clock } from "lucide-react";
import type { TransferLog } from "../types";

const statusIcons: Record<string, React.ReactNode> = {
	completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
	failed: <XCircle className="w-4 h-4 text-destructive" />,
	transferring: <Clock className="w-4 h-4 text-amber-500" />,
	pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export function Dashboard() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["stats"],
		queryFn: api.getStats,
		refetchInterval: 3000,
	});

	if (isLoading) {
		return <div className="text-muted-foreground">Loading dashboard...</div>;
	}

	return (
		<div>
			<h2 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h2>
			<p className="text-sm text-muted-foreground mb-6">Overview of your transfer activity.</p>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard icon={<FileBox className="w-5 h-5" />} tone="primary" label="Active Jobs" value={String(stats?.activeJobs ?? 0)} />
				<StatCard icon={<Activity className="w-5 h-5" />} tone="emerald" label="Total Transfers" value={String(stats?.totalTransfers ?? 0)} />
				<StatCard icon={<XCircle className="w-5 h-5" />} tone="rose" label="Failed" value={String(stats?.failedTransfers ?? 0)} />
				<StatCard icon={<CheckCircle className="w-5 h-5" />} tone="teal" label="Success Rate" value={`${stats?.successRate ?? 100}%`} />
			</div>

			<div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
				<h3 className="text-lg font-semibold mb-4">Recent Transfers</h3>
				{!stats?.recentTransfers || stats.recentTransfers.length === 0 ? (
					<p className="text-muted-foreground text-sm">No transfers yet. Create a job to get started.</p>
				) : (
					<div className="space-y-1">
						{stats.recentTransfers.map((t: TransferLog) => (
							<div key={t.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
								{statusIcons[t.status] ?? t.status}
								<span className="font-medium">{t.fileName}</span>
								<span className="text-muted-foreground">{t.job?.name}</span>
								<span className="text-muted-foreground/70 ml-auto">{new Date(t.startedAt).toLocaleString()}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

const toneClasses: Record<string, string> = {
	primary: "bg-primary/10 text-primary",
	emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
	teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

function StatCard({ icon, label, value, tone = "primary" }: { icon: React.ReactNode; label: string; value: string; tone?: keyof typeof toneClasses }) {
	return (
		<div className="bg-card text-card-foreground rounded-xl border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
			<div className={`grid place-items-center w-10 h-10 rounded-lg ${toneClasses[tone]}`}>{icon}</div>
			<div>
				<p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
				<p className="text-2xl font-semibold">{value}</p>
			</div>
		</div>
	);
}
