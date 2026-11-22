import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

export type RuntimeEnv = Record<string, string | undefined>;

/** Cloudflare Pages bindings win over local `.env` in production. */
export function runtimeEnv(event?: Pick<RequestEvent, 'platform'>): RuntimeEnv {
	const platform = event?.platform as App.Platform | undefined;
	return { ...(privateEnv as RuntimeEnv), ...(platform?.env ?? {}) };
}

export function publicValue(key: string, fallback = ''): string {
	return (publicEnv as Record<string, string | undefined>)[key] ?? fallback;
}

export function siteOrigin(event?: RequestEvent): string {
	if (event) return event.url.origin;
	return publicValue('PUBLIC_SITE_URL', 'https://scriptora.ewinproject.org').replace(/\/$/, '');
}

export function convexHttpUrl(env: RuntimeEnv): string {
	return (
		env.CONVEX_HTTP_ACTIONS_URL ||
		publicValue('PUBLIC_CONVEX_SITE_URL', 'https://disciplined-cuttlefish-2.eu-west-1.convex.site')
	).replace(/\/$/, '');
}

export function isLiveConfigured(env: RuntimeEnv): boolean {
	return Boolean(env.ADMIN_SESSION_SECRET && convexHttpUrl(env));
}

export function integrationPresence(env: RuntimeEnv) {
	return {
		convex: Boolean(convexHttpUrl(env)),
		agnes: Boolean(env.AGNES_AI_KEY),
		resend: Boolean(env.RESEND_API_KEY),
		google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
		github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
		r2: Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY),
		ewin: Boolean(env.EWIN_HUB_URL || publicValue('PUBLIC_EWIN_HUB_URL')),
		workersAi: Boolean(env.CLOUDFLARE_API_TOKEN)
	};
}
