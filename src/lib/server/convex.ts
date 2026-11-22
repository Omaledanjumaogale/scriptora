import type { RequestEvent } from '@sveltejs/kit';
import type { AppState } from '$lib/types';
import { convexHttpUrl, runtimeEnv } from './env';

type ConvexOptions = { method?: 'GET' | 'POST'; body?: unknown };

export class ConvexError extends Error {
	status: number;
	constructor(message: string, status = 502) {
		super(message);
		this.status = status;
	}
}

async function request<T>(event: RequestEvent, path: string, options: ConvexOptions = {}): Promise<T> {
	const env = runtimeEnv(event);
	const secret = env.ADMIN_SESSION_SECRET;
	if (!secret) throw new ConvexError('ADMIN_SESSION_SECRET is not configured', 503);
	const res = await fetch(`${convexHttpUrl(env)}${path}`, {
		method: options.method ?? 'GET',
		headers: {
			Authorization: `Bearer ${secret}`,
			...(options.body ? { 'Content-Type': 'application/json' } : {})
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
		signal: AbortSignal.timeout(20_000)
	});
	const text = await res.text();
	let data: unknown = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { error: text.slice(0, 500) };
	}
	if (res.status === 404) return data as T;
	if (!res.ok) {
		const message =
			typeof data === 'object' && data && 'error' in data ? String((data as { error: unknown }).error) : `Convex ${res.status}`;
		throw new ConvexError(message, res.status);
	}
	return data as T;
}

export async function getLiveState(event: RequestEvent, workspaceKey: string) {
	return await request<{ found: boolean; state?: AppState; updatedAt?: string; source?: string }>(
		event,
		`/state?key=${encodeURIComponent(workspaceKey)}`
	);
}

export async function saveLiveState(
	event: RequestEvent,
	input: { workspaceKey: string; userEmail: string; state: AppState; source?: 'seed' | 'live' | 'imported' }
) {
	return await request<{ ok: boolean; id: string; updatedAt: string }>(event, '/state', {
		method: 'POST',
		body: input
	});
}

export async function deleteLiveState(event: RequestEvent, workspaceKey: string) {
	return await request<{ ok: boolean; removed: boolean }>(event, '/state/delete', {
		method: 'POST',
		body: { workspaceKey }
	});
}

export type AdminOverview = {
	workspaces: number;
	books: number;
	words: number;
	runs: number;
	liveRuns: number;
	revenue: number;
	booksList: Array<Record<string, unknown>>;
	members: Array<Record<string, unknown>>;
	recent: Array<Record<string, unknown>>;
	at: string;
};

export async function adminOverview(event: RequestEvent): Promise<AdminOverview> {
	return await request<AdminOverview>(event, '/admin/overview');
}

export async function adminState(event: RequestEvent, workspaceKey: string) {
	return await getLiveState(event, workspaceKey);
}

export async function generateChapter(
	event: RequestEvent,
	input: {
		bookTitle: string;
		genre: string;
		audience: string;
		chapterTitle: string;
		summary: string;
		purpose: string;
		targetWords: number;
		voice?: string;
		model?: string;
	}
) {
	return await request<{ text: string; model: string; provider: string; usage?: Record<string, number> }>(
		event,
		'/ai/chapter',
		{ method: 'POST', body: input }
	);
}

export async function sendEmail(
	event: RequestEvent,
	input: { to: string; subject: string; html: string }
) {
	return await request<{ ok: boolean }>(event, '/email', { method: 'POST', body: input });
}

export async function health(event: RequestEvent) {
	const env = runtimeEnv(event);
	const res = await fetch(`${convexHttpUrl(env)}/health`, { signal: AbortSignal.timeout(10_000) });
	return (await res.json()) as {
		status: string;
		service: string;
		at: string;
		capabilities: { state: boolean; ai: boolean; email: boolean };
	};
}
