import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSessionCookie } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	clearSessionCookie(event);
	return json({ ok: true });
};

export const GET: RequestHandler = async (event) => {
	clearSessionCookie(event);
	return json({ ok: true });
};
