import type {
	Connection,
	CreateConnectionInput,
	CreateJobInput,
	Job,
	RunSummary,
	Stats,
	TransferLog,
} from "../types";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});
	if (!res.ok) {
		const error = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(typeof error.error === "string" ? error.error : `Request failed: ${res.status}`);
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export const api = {
	// Connections
	getConnections: () => request<Connection[]>("/connections"),
	getConnection: (id: string) => request<Connection>(`/connections/${id}`),
	createConnection: (data: CreateConnectionInput) =>
		request<Connection>("/connections", { method: "POST", body: JSON.stringify(data) }),
	updateConnection: (id: string, data: CreateConnectionInput) =>
		request<Connection>(`/connections/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteConnection: (id: string) => request<void>(`/connections/${id}`, { method: "DELETE" }),
	testConnection: (id: string) => request<{ ok: boolean; error?: string }>(`/connections/${id}/test`, { method: "POST" }),
	uploadKey: async (file: File): Promise<{ keyPath: string }> => {
		const body = new FormData();
		body.append("key", file);
		const res = await fetch(`${BASE_URL}/connections/upload-key`, { method: "POST", body });
		if (!res.ok) {
			const error = await res.json().catch(() => ({ error: res.statusText }));
			throw new Error(typeof error.error === "string" ? error.error : `Upload failed: ${res.status}`);
		}
		return res.json();
	},

	// Jobs
	getJobs: () => request<Job[]>("/jobs"),
	getJob: (id: string) => request<Job>(`/jobs/${id}`),
	createJob: (data: CreateJobInput) => request<Job>("/jobs", { method: "POST", body: JSON.stringify(data) }),
	updateJob: (id: string, data: CreateJobInput) =>
		request<Job>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteJob: (id: string) => request<void>(`/jobs/${id}`, { method: "DELETE" }),
	runJob: (id: string) => request<RunSummary>(`/jobs/${id}/run`, { method: "POST" }),

	// Transfers
	getTransfers: (params?: Record<string, string>) => {
		const query = params ? "?" + new URLSearchParams(params).toString() : "";
		return request<{ transfers: TransferLog[]; total: number }>(`/transfers${query}`);
	},
	getStats: () => request<Stats>("/transfers/stats"),
};
