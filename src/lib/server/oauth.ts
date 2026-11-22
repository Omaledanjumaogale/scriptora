import type { RequestEvent } from '@sveltejs/kit';
import type { SessionUser } from './session';
import { runtimeEnv, siteOrigin } from './env';

export type OAuthProvider = 'google' | 'github';

export function providerConfigured(event: RequestEvent, provider: OAuthProvider): boolean {
	const env = runtimeEnv(event);
	return provider === 'google'
		? Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
		: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

export function callbackUrl(event: RequestEvent, provider: OAuthProvider): string {
	return `${siteOrigin(event)}/api/auth/${provider}/callback`;
}

export function authorizeUrl(event: RequestEvent, provider: OAuthProvider, state: string): string {
	const env = runtimeEnv(event);
	const redirect = callbackUrl(event, provider);
	if (provider === 'google') {
		const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID ?? '');
		url.searchParams.set('redirect_uri', redirect);
		url.searchParams.set('response_type', 'code');
		url.searchParams.set('scope', 'openid email profile');
		url.searchParams.set('state', state);
		url.searchParams.set('prompt', 'select_account');
		url.searchParams.set('access_type', 'online');
		return url.toString();
	}
	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', env.GITHUB_CLIENT_ID ?? '');
	url.searchParams.set('redirect_uri', redirect);
	url.searchParams.set('scope', 'read:user user:email');
	url.searchParams.set('state', state);
	return url.toString();
}

async function exchangeGoogle(event: RequestEvent, code: string): Promise<Omit<SessionUser, 'workspaceKey'>> {
	const env = runtimeEnv(event);
	const body = new URLSearchParams({
		code,
		client_id: env.GOOGLE_CLIENT_ID ?? '',
		client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
		redirect_uri: callbackUrl(event, 'google'),
		grant_type: 'authorization_code'
	});
	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});
	if (!tokenRes.ok) throw new Error(`Google token exchange failed (${tokenRes.status})`);
	const token = (await tokenRes.json()) as { access_token?: string };
	if (!token.access_token) throw new Error('Google did not return an access token');
	const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${token.access_token}` }
	});
	if (!userRes.ok) throw new Error(`Google userinfo failed (${userRes.status})`);
	const profile = (await userRes.json()) as {
		sub: string;
		email?: string;
		email_verified?: boolean;
		name?: string;
		picture?: string;
	};
	if (!profile.email || profile.email_verified === false) throw new Error('Google account email is not verified');
	return {
		sub: profile.sub,
		email: profile.email,
		name: profile.name ?? profile.email.split('@')[0],
		avatar: profile.picture,
		provider: 'google'
	};
}

async function exchangeGitHub(event: RequestEvent, code: string): Promise<Omit<SessionUser, 'workspaceKey'>> {
	const env = runtimeEnv(event);
	const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: callbackUrl(event, 'github')
		})
	});
	if (!tokenRes.ok) throw new Error(`GitHub token exchange failed (${tokenRes.status})`);
	const token = (await tokenRes.json()) as { access_token?: string; error_description?: string };
	if (!token.access_token) throw new Error(token.error_description ?? 'GitHub did not return an access token');
	const headers = {
		Authorization: `Bearer ${token.access_token}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
	const userRes = await fetch('https://api.github.com/user', { headers });
	if (!userRes.ok) throw new Error(`GitHub profile failed (${userRes.status})`);
	const profile = (await userRes.json()) as {
		id: number;
		login: string;
		name?: string;
		email?: string;
		avatar_url?: string;
	};
	let email = profile.email ?? '';
	if (!email) {
		const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
		if (emailsRes.ok) {
			const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
			email = emails.find((e) => e.primary && e.verified)?.email ?? emails.find((e) => e.verified)?.email ?? '';
		}
	}
	if (!email) throw new Error('GitHub account has no verified email');
	return {
		sub: String(profile.id),
		email,
		name: profile.name ?? profile.login,
		avatar: profile.avatar_url,
		provider: 'github'
	};
}

export async function exchangeCode(
	event: RequestEvent,
	provider: OAuthProvider,
	code: string
): Promise<Omit<SessionUser, 'workspaceKey'>> {
	return provider === 'google' ? await exchangeGoogle(event, code) : await exchangeGitHub(event, code);
}
