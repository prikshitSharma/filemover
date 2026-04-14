import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, ArrowRight, FileBox, Play, Trash2 } from "lucide-react";
import { JobForm } from "../components/JobForm";
import type { Job, RunSummary } from "../types";

export function Jobs() {
	const qc = useQueryClient();
	const [formOpen, setFormOpen] = useState(false);
	const [lastRun, setLastRun] = useState<Record<string, RunSummary | { error: string }>>({});

	const { data: jobs, isLoading } = useQuery({
		queryKey: ["jobs"],
		queryFn: api.getJobs,
	});

	const deleteMut = useMutation({
		mutationFn: api.deleteJob,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
	});

	const runMut = useMutation({
		mutationFn: api.runJob,
		onSuccess: (summary, id) => {
			setLastRun((prev) => ({ ...prev, [id]: summary }));
			qc.invalidateQueries({ queryKey: ["transfers"] });
			qc.invalidateQueries({ queryKey: ["stats"] });
		},
		onError: (err: Error, id) => setLastRun((prev) => ({ ...prev, [id]: { error: err.message } })),
	});

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Transfer Jobs</h2>
				<button
					onClick={() => setFormOpen(true)}
					className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
				>
					<Plus className="w-4 h-4" />
					New Job
				</button>
			</div>

			{isLoading ? (
				<div className="text-gray-500">Loading jobs...</div>
			) : !jobs || jobs.length === 0 ? (
				<div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
					<FileBox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">No transfer jobs yet</h3>
					<p className="text-gray-500 text-sm">Create a job to start moving files between connections.</p>
				</div>
			) : (
				<div className="space-y-4">
					{jobs.map((job: Job) => {
						const runState = lastRun[job.id];
						const running = runMut.isPending && runMut.variables === job.id;
						return (
							<div key={job.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900">{job.name}</h3>
									<div className="flex items-center gap-2">
										<span className={`px-2 py-0.5 rounded text-xs font-medium ${job.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
											{job.enabled ? "Active" : "Disabled"}
										</span>
										<button
											onClick={() => runMut.mutate(job.id)}
											disabled={running}
											className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
										>
											<Play className="w-3 h-3" />
											{running ? "Running..." : "Run"}
										</button>
										<button
											onClick={() => {
												if (confirm(`Delete job "${job.name}"?`)) deleteMut.mutate(job.id);
											}}
											className="text-gray-400 hover:text-red-600"
											title="Delete"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
								<div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
									<span className="px-2 py-0.5 bg-blue-50 rounded text-xs uppercase font-medium">{job.sourceConnection.type}</span>
									<span>{job.sourceConnection.name}:{job.sourcePath}</span>
									<ArrowRight className="w-4 h-4 text-gray-400" />
									<span className="px-2 py-0.5 bg-blue-50 rounded text-xs uppercase font-medium">{job.destConnection.type}</span>
									<span>{job.destConnection.name}:{job.destPath}</span>
								</div>
								{runState && "error" in runState && (
									<div className="mt-3 text-xs text-red-700 bg-red-50 rounded px-3 py-2">Run failed: {runState.error}</div>
								)}
								{runState && "filesAttempted" in runState && (
									<div className="mt-3 text-xs text-gray-700 bg-gray-50 rounded px-3 py-2">
										Last run: {runState.filesSucceeded}/{runState.filesAttempted} succeeded
										{runState.filesFailed > 0 && <span className="text-red-700"> — {runState.filesFailed} failed</span>}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			<JobForm open={formOpen} onClose={() => setFormOpen(false)} />
		</div>
	);
}
