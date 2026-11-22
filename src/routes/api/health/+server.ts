import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { health } from '$lib/server/convex';
import { integrationPresence, runtimeEnv, publicValue } from '$lib/server/env';

export const GET: RequestHandler = async (event) => {
	const presence = integrationPresence(runtimeEnv(event));
	let convex: Awaited<ReturnType<typeof health>> | { status: string; error?: string } = {
		status: 'unavailable'
	};
	try {
		convex = await health(event);
	} catch (error) {
		convex = { status: 'unavailable', error: error instanceof Error ? error.message : 'unreachable' };
	}
	let ewin = { status: 'unknown' };
	try {
		const res = await fetch('https://ewinproject.org/api/health', { signal: AbortSignal.timeout(8_000) });
		ewin = (await res.json()) as { status: string };
	} catch {
		ewin = { status: 'unavailable' };
	}
	return json({
		status: 'ok',
		service: 'scriptora-pages',
		domain: publicValue('PUBLIC_SITE_URL', 'https://scriptora.ewinproject.org'),
		at: new Date().toISOString(),
		convex,
		ewin,
		integrations: presence
	});
};
