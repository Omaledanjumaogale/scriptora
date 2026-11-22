import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAdminCookie } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	clearAdminCookie(event);
	return json({ ok: true });
};
