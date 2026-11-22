import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authorizeUrl, providerConfigured } from '$lib/server/oauth';
import { makeOAuthState, setOAuthState } from '$lib/server/session';

export const GET: RequestHandler = async (event) => {
	if (!providerConfigured(event, 'github')) {
		redirect(302, '/login?error=github-not-configured');
	}
	const state = makeOAuthState();
	setOAuthState(event, state);
	redirect(302, authorizeUrl(event, 'github', state));
};
