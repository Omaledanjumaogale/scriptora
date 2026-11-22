export const SITE = {
	name: 'Scriptora',
	domain: 'scriptora.ewinproject.org',
	url: 'https://scriptora.ewinproject.org',
	ewinHub: 'https://ewinproject.org',
	ewinEcosystem: 'https://ewinproject.org/ecosystem',
	convexUrl: 'https://disciplined-cuttlefish-2.eu-west-1.convex.cloud',
	convexSiteUrl: 'https://disciplined-cuttlefish-2.eu-west-1.convex.site',
	planPrice: 5000,
	planLabel: 'Enterprise'
} as const;

export const OAUTH_CALLBACKS = {
	google: `${SITE.url}/api/auth/google/callback`,
	github: `${SITE.url}/api/auth/github/callback`
} as const;
