import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { issueAdminSession, passwordMatches } from '$lib/server/session';
import { runtimeEnv } from '$lib/server/env';

export const POST: RequestHandler = async (event) => {
	const env = runtimeEnv(event);
	if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
		return json({ error: 'Super-admin credentials are not configured' }, { status: 503 });
	}
	let body: { email?: string; password?: string };
	try {
		body = (await event.request.json()) as typeof body;
	} catch {
		return json({ error: 'Invalid request' }, { status: 400 });
	}
	const email = String(body.email ?? '').trim();
	const password = String(body.password ?? '');
	if (!(await passwordMatches(event, email, password))) {
		return json({ error: 'Invalid email or password' }, { status: 401 });
	}
	await issueAdminSession(event, email);
	return json({ ok: true, email });
};
