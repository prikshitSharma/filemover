import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Plus, ArrowRight, FileBox, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
			<div className="flex items-center justify-between mb-1">
				<h2 className="text-2xl font-bold tracking-tight">Transfer Jobs</h2>
				<Button onClick={() => setFormOpen(true)} size="sm">
					<Plus className="w-4 h-4 mr-1.5" />
					New Job
				</Button>
			</div>
			<p className="text-sm text-muted-foreground mb-6">Configure and run your file transfer jobs.</p>

			{isLoading ? (
				<div className="text-muted-foreground">Loading jobs...</div>
			) : !jobs || jobs.length === 0 ? (
				<div className="bg-card text-card-foreground rounded-xl border p-12 text-center shadow-sm">
					<FileBox className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
					<h3 className="text-lg font-medium mb-2">No transfer jobs yet</h3>
					<p className="text-muted-foreground text-sm">Create a job to start moving files between connections.</p>
				</div>
			) : (
				<div className="space-y-3">
					{jobs.map((job: Job) => {
						const runState = lastRun[job.id];
						const running = runMut.isPending && runMut.variables === job.id;
						return (
							<div key={job.id} className="bg-card text-card-foreground rounded-xl border p-5 hover:shadow-md transition-shadow shadow-sm">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">{job.name}</h3>
									<div className="flex items-center gap-2">
										<span className={`px-2 py-0.5 rounded text-xs font-medium ${job.enabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
											{job.enabled ? "Active" : "Disabled"}
										</span>
										<Button
											size="sm"
											onClick={() => runMut.mutate(job.id)}
											disabled={running}
										>
											<Play className="w-3 h-3 mr-1" />
											{running ? "Running..." : "Run"}
										</Button>
										<button
											onClick={() => {
												if (confirm(`Delete job "${job.name}"?`)) deleteMut.mutate(job.id);
											}}
											className="text-muted-foreground/50 hover:text-destructive transition-colors"
											title="Delete"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
								<div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
									<span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs uppercase font-medium">{job.sourceConnection.type}</span>
									<span>{job.sourceConnection.name}:{job.sourcePath}</span>
									<ArrowRight className="w-4 h-4 text-muted-foreground/50" />
									<span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs uppercase font-medium">{job.destConnection.type}</span>
									<span>{job.destConnection.name}:{job.destPath}</span>
								</div>
								{runState && "error" in runState && (
									<div className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">Run failed: {runState.error}</div>
								)}
								{runState && "filesAttempted" in runState && (
									<div className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
										Last run: {runState.filesSucceeded}/{runState.filesAttempted} succeeded
										{runState.filesFailed > 0 && <span className="text-destructive"> — {runState.filesFailed} failed</span>}
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