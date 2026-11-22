import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCode } from '$lib/server/oauth';
import { clearOAuthState, issueUserSession, readOAuthState } from '$lib/server/session';
import { sendEmail } from '$lib/server/convex';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const expected = readOAuthState(event);
	clearOAuthState(event);
	if (!code || !state || !expected || state !== expected) {
		redirect(302, '/login?error=oauth-state');
	}
	try {
		const profile = await exchangeCode(event, 'google', code);
		await issueUserSession(event, profile);
		void sendEmail(event, {
			to: profile.email,
			subject: 'Welcome to Scriptora',
			html: `<p>Hi ${profile.name},</p><p>Your Scriptora studio is ready. Your demo catalogue is available immediately and will be replaced by live workspace data as you save.</p><p><a href="https://scriptora.ewinproject.org/app">Open Scriptora</a></p>`
		}).catch(() => undefined);
		redirect(302, '/app');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Google sign-in failed';
		redirect(302, `/login?error=${encodeURIComponent(message)}`);
	}
};
