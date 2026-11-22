import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
}

function authorised(request: Request) {
	const expected = process.env.ADMIN_SESSION_SECRET;
	if (!expected) return false;
	const header = request.headers.get('authorization') ?? '';
	const value = header.startsWith('Bearer ') ? header.slice(7) : '';
	if (value.length !== expected.length) return false;
	let mismatch = 0;
	for (let i = 0; i < value.length; i++) mismatch |= value.charCodeAt(i) ^ expected.charCodeAt(i);
	return mismatch === 0;
}

http.route({
	path: '/health',
	method: 'GET',
	handler: httpAction(async () => {
		return json({
			status: 'ok',
			service: 'scriptora-convex',
			at: new Date().toISOString(),
			capabilities: {
				state: true,
				ai: Boolean(process.env.AGNES_AI_KEY),
				email: Boolean(process.env.RESEND_API_KEY)
			}
		});
	})
});

http.route({
	path: '/state',
	method: 'GET',
	handler: httpAction(async (ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const key = new URL(request.url).searchParams.get('key');
		if (!key) return json({ error: 'missing key' }, 400);
		const doc = await ctx.runQuery(internal.state.get, { workspaceKey: key });
		if (!doc) return json({ found: false, state: null }, 404);
		return json({ found: true, ...doc });
	})
});

http.route({
	path: '/state',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const body = (await request.json()) as {
			workspaceKey?: string;
			userEmail?: string;
			state?: unknown;
			source?: 'seed' | 'live' | 'imported';
		};
		if (!body.workspaceKey || !body.userEmail || !body.state) {
			return json({ error: 'workspaceKey, userEmail and state are required' }, 400);
		}
		if (JSON.stringify(body.state).length > 8_000_000) return json({ error: 'state too large' }, 413);
		const id = await ctx.runMutation(internal.state.upsert, {
			workspaceKey: body.workspaceKey.slice(0, 200),
			userEmail: body.userEmail.slice(0, 320),
			state: body.state,
			source: body.source ?? 'live'
		});
		return json({ ok: true, id, updatedAt: new Date().toISOString() });
	})
});

http.route({
	path: '/state/delete',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const body = (await request.json()) as { workspaceKey?: string };
		if (!body.workspaceKey) return json({ error: 'workspaceKey required' }, 400);
		const removed = await ctx.runMutation(internal.state.remove, { workspaceKey: body.workspaceKey });
		return json({ ok: true, removed });
	})
});

http.route({
	path: '/admin/overview',
	method: 'GET',
	handler: httpAction(async (ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const data = await ctx.runQuery(internal.state.overview, {});
		return json({
			...data,
			convexUrl: process.env.CONVEX_CLOUD_URL ?? null,
			at: new Date().toISOString()
		});
	})
});

http.route({
	path: '/ai/chapter',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const body = (await request.json()) as Record<string, unknown>;
		try {
			const result = await ctx.runAction(internal.ai.generateChapter, {
				bookTitle: String(body.bookTitle ?? 'Untitled'),
				genre: String(body.genre ?? 'Literary Fiction'),
				audience: String(body.audience ?? 'General readers'),
				chapterTitle: String(body.chapterTitle ?? 'Chapter'),
				summary: String(body.summary ?? ''),
				purpose: String(body.purpose ?? ''),
				targetWords: Number(body.targetWords ?? 2400),
				voice: body.voice ? String(body.voice) : undefined,
				model: body.model ? String(body.model) : undefined
			});
			return json(result);
		} catch (error) {
			return json({ error: error instanceof Error ? error.message : 'generation failed' }, 502);
		}
	})
});

http.route({
	path: '/email',
	method: 'POST',
	handler: httpAction(async (_ctx, request) => {
		if (!authorised(request)) return json({ error: 'unauthorised' }, 401);
		const key = process.env.RESEND_API_KEY;
		if (!key) return json({ error: 'RESEND_API_KEY is not configured' }, 503);
		const body = (await request.json()) as { to?: string; subject?: string; html?: string };
		if (!body.to || !body.subject || !body.html) return json({ error: 'to, subject and html are required' }, 400);
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: process.env.RESEND_FROM_EMAIL ?? 'Scriptora <no-reply@ewinproject.org>',
				to: [body.to],
				subject: body.subject,
				html: body.html
			})
		});
		const detail = await res.text();
		if (!res.ok) return json({ error: detail }, 502);
		return json({ ok: true, detail: JSON.parse(detail) });
	})
});

export default http;
