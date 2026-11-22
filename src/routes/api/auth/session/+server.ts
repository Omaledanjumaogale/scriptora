import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin, readUser } from '$lib/server/session';
import { integrationPresence, runtimeEnv } from '$lib/server/env';

export const GET: RequestHandler = async (event) => {
	const [user, admin] = await Promise.all([readUser(event), readAdmin(event)]);
	return json({
		authenticated: Boolean(user),
		user,
		admin: Boolean(admin),
		adminEmail: admin?.email ?? null,
		live: integrationPresence(runtimeEnv(event)),
		provider: user?.provider ?? null,
		at: new Date().toISOString()
	});
};
