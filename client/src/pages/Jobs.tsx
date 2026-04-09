import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, ArrowRight, FileBox } from "lucide-react";

export function Jobs() {
	const { data: jobs, isLoading } = useQuery({
		queryKey: ["jobs"],
		queryFn: api.getJobs,
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Transfer Jobs</h2>
				<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
					<Plus className="w-4 h-4" />
					New Job
				</button>
			</div>

			{isLoading ? (
				<div className="text-gray-500">Loading jobs...</div>
			) : !jobs || (jobs as unknown[]).length === 0 ? (
				<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
					<FileBox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No transfer jobs yet</h3>
					<p className="text-gray-500 text-sm">Create a job to start moving files between connections.</p>
				</div>
			) : (
				<div className="space-y-4">
					{(jobs as Record<string, unknown>[]).map((job) => {
						const source = job.sourceConnection as Record<string, unknown>;
						const dest = job.destConnection as Record<string, unknown>;
						return (
							<div key={String(job.id)} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900">{String(job.name)}</h3>
									<span className={`px-2 py-0.5 rounded text-xs font-medium ${job.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
										{job.enabled ? "Active" : "Disabled"}
									</span>
								</div>
								<div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
									<span className="px-2 py-0.5 bg-blue-50 rounded text-xs uppercase font-medium">{String(source.type)}</span>
									<span>{String(source.name)}</span>
									<ArrowRight className="w-4 h-4 text-gray-400" />
									<span className="px-2 py-0.5 bg-blue-50 rounded text-xs uppercase font-medium">{String(dest.type)}</span>
									<span>{String(dest.name)}</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
