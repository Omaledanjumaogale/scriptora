import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin } from '$lib/server/session';
import { adminState } from '$lib/server/convex';

export const GET: RequestHandler = async (event) => {
	const admin = await readAdmin(event);
	if (!admin) return json({ error: 'admin session required' }, { status: 401 });
	const key = event.url.searchParams.get('key');
	if (!key) return json({ error: 'key required' }, { status: 400 });
	try {
		const result = await adminState(event, key);
		return json(result);
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'State unavailable' }, { status: 502 });
	}
};
