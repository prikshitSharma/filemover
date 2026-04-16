import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/api/client";
import type { CreateJobInput } from "@/types";

interface Props {
	open: boolean;
	onClose: () => void;
}

const EMPTY: CreateJobInput = {
	name: "",
	sourceConnectionId: "",
	sourcePath: "",
	destConnectionId: "",
	destPath: "",
	filePattern: "*",
};

export function JobForm({ open, onClose }: Props) {
	const qc = useQueryClient();
	const { data: connections } = useQuery({ queryKey: ["connections"], queryFn: api.getConnections, enabled: open });
	const [form, setForm] = useState<CreateJobInput>(EMPTY);
	const [error, setError] = useState<string | null>(null);

	const createMut = useMutation({
		mutationFn: api.createJob,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["jobs"] });
			setForm(EMPTY);
			setError(null);
			onClose();
		},
		onError: (err: Error) => setError(err.message),
	});

	function submit() {
		setError(null);
		createMut.mutate(form);
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Transfer Job</DialogTitle>
					<DialogDescription>Define what files move between which connections.</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<form
						id="job-form"
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="space-y-3"
					>
					<div className="space-y-1.5">
						<Label htmlFor="job-name">Job name</Label>
						<Input
							id="job-name"
							required
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="Nightly backup"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Source connection</Label>
							<Select value={form.sourceConnectionId} onValueChange={(v) => setForm({ ...form, sourceConnectionId: v })}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select..." />
								</SelectTrigger>
								<SelectContent>
									{connections?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name} ({c.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="job-src-path">Source path</Label>
							<Input
								id="job-src-path"
								required
								value={form.sourcePath}
								onChange={(e) => setForm({ ...form, sourcePath: e.target.value })}
								placeholder="/pub/example"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Destination connection</Label>
							<Select value={form.destConnectionId} onValueChange={(v) => setForm({ ...form, destConnectionId: v })}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select..." />
								</SelectTrigger>
								<SelectContent>
									{connections?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name} ({c.type})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="job-dst-path">Destination path</Label>
							<Input
								id="job-dst-path"
								required
								value={form.destPath}
								onChange={(e) => setForm({ ...form, destPath: e.target.value })}
								placeholder="/out"
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="job-pattern">File pattern</Label>
						<Input
							id="job-pattern"
							value={form.filePattern ?? "*"}
							onChange={(e) => setForm({ ...form, filePattern: e.target.value })}
							placeholder="*.txt"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="job-schedule">Schedule (cron expression)</Label>
						<Input
							id="job-schedule"
							value={form.schedule ?? ""}
							onChange={(e) => setForm({ ...form, schedule: e.target.value || null })}
							placeholder="Leave blank for manual only — e.g. */5 * * * * (every 5 min)"
						/>
						<p className="text-xs text-muted-foreground">
							Format: minute hour day month weekday — e.g. <code className="text-xs">0 2 * * *</code> = daily at 2 AM
						</p>
					</div>
					{error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}
					</form>
				</DialogBody>
				<DialogFooter>
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" form="job-form" disabled={createMut.isPending}>
						{createMut.isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
