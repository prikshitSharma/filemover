import { z } from "zod";

export const ConnectionSchema = z.object({
	name: z.string().min(1),
	type: z.enum(["sftp", "ftp", "smb", "sharepoint", "azure-storage"]),
	host: z.string().min(1),
	port: z.number().int().positive().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
	keyPath: z.string().optional(),
	extra: z.record(z.unknown()).optional(),
});

export const JobSchema = z.object({
	name: z.string().min(1),
	sourceConnectionId: z.string().uuid(),
	sourcePath: z.string().min(1),
	destConnectionId: z.string().uuid(),
	destPath: z.string().min(1),
	filePattern: z.string().default("*"),
	schedule: z.string().nullable().optional(),
	onComplete: z.enum(["nothing", "archive", "delete"]).default("nothing"),
	enabled: z.boolean().default(true),
});

export type CreateConnectionInput = z.infer<typeof ConnectionSchema>;
export type CreateJobInput = z.infer<typeof JobSchema>;
