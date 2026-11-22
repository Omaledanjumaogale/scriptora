import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin } from '$lib/server/session';
import { adminOverview } from '$lib/server/convex';
import { integrationPresence, publicValue, runtimeEnv, siteOrigin } from '$lib/server/env';

export const GET: RequestHandler = async (event) => {
	const admin = await readAdmin(event);
	if (!admin) return json({ error: 'admin session required' }, { status: 401 });
	const env = runtimeEnv(event);
	try {
		const overview = await adminOverview(event);
		return json({
			admin,
			overview,
			integrations: integrationPresence(env),
			site: {
				origin: siteOrigin(event),
				publicUrl: publicValue('PUBLIC_SITE_URL', 'https://scriptora.ewinproject.org'),
				convexUrl: publicValue('PUBLIC_CONVEX_URL'),
				convexSiteUrl: publicValue('PUBLIC_CONVEX_SITE_URL'),
				ewinHub: publicValue('PUBLIC_EWIN_HUB_URL', 'https://ewinproject.org'),
				ewinEcosystem: publicValue('PUBLIC_EWIN_ECOSYSTEM_URL', 'https://ewinproject.org/ecosystem'),
				googleCallback: `${siteOrigin(event)}/api/auth/google/callback`,
				githubCallback: `${siteOrigin(event)}/api/auth/github/callback`
			},
			at: new Date().toISOString()
		});
	} catch (error) {
		return json(
			{
				admin,
				error: error instanceof Error ? error.message : 'Live admin data unavailable',
				overview: null,
				integrations: integrationPresence(env),
				at: new Date().toISOString()
			},
			{ status: 200 }
		);
	}
};
