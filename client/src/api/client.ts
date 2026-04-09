const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});
	if (!res.ok) {
		const error = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(error.error || `Request failed: ${res.status}`);
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export const api = {
	// Connections
	getConnections: () => request<unknown[]>("/connections"),
	getConnection: (id: string) => request<unknown>(`/connections/${id}`),
	createConnection: (data: unknown) => request<unknown>("/connections", { method: "POST", body: JSON.stringify(data) }),
	updateConnection: (id: string, data: unknown) => request<unknown>(`/connections/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteConnection: (id: string) => request<void>(`/connections/${id}`, { method: "DELETE" }),

	// Jobs
	getJobs: () => request<unknown[]>("/jobs"),
	getJob: (id: string) => request<unknown>(`/jobs/${id}`),
	createJob: (data: unknown) => request<unknown>("/jobs", { method: "POST", body: JSON.stringify(data) }),
	updateJob: (id: string, data: unknown) => request<unknown>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteJob: (id: string) => request<void>(`/jobs/${id}`, { method: "DELETE" }),

	// Transfers
	getTransfers: (params?: Record<string, string>) => {
		const query = params ? "?" + new URLSearchParams(params).toString() : "";
		return request<{ transfers: unknown[]; total: number }>(`/transfers${query}`);
	},
	getStats: () => request<unknown>("/transfers/stats"),
};
