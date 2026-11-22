import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readUser } from '$lib/server/session';
import { getLiveState, saveLiveState } from '$lib/server/convex';
import type { AppState } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = await readUser(event);
	if (!user) return json({ mode: 'mock', state: null, authenticated: false });
	try {
		const live = await getLiveState(event, user.workspaceKey);
		if (!live.found || !live.state) {
			return json({ mode: 'empty', state: null, workspaceKey: user.workspaceKey, authenticated: true });
		}
		return json({
			mode: 'live',
			state: live.state,
			workspaceKey: user.workspaceKey,
			updatedAt: live.updatedAt,
			source: live.source,
			authenticated: true
		});
	} catch (error) {
		return json(
			{
				mode: 'offline',
				state: null,
				error: error instanceof Error ? error.message : 'Live state unavailable',
				authenticated: true
			},
			{ status: 200 }
		);
	}
};

export const POST: RequestHandler = async (event) => {
	const user = await readUser(event);
	if (!user) return json({ error: 'sign in required' }, { status: 401 });
	const length = Number(event.request.headers.get('content-length') ?? 0);
	if (length > 9_000_000) return json({ error: 'state too large' }, { status: 413 });
	let body: { state?: AppState; source?: 'seed' | 'live' | 'imported' };
	try {
		body = (await event.request.json()) as typeof body;
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}
	if (!body.state || typeof body.state !== 'object') return json({ error: 'state required' }, { status: 400 });
	try {
		const result = await saveLiveState(event, {
			workspaceKey: user.workspaceKey,
			userEmail: user.email,
			state: { ...body.state, updatedAt: new Date().toISOString() } as AppState,
			source: body.source ?? 'live'
		});
		return json({ ...result });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Live save failed', fallback: true },
			{ status: 200 }
		);
	}
};
