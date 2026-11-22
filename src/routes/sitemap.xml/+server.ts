import type { RequestHandler } from '@sveltejs/kit';
import { SITE } from '$lib/config';

export const prerender = true;

const routes = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/login', priority: '0.6', changefreq: 'monthly' },
	{ path: '/app', priority: '0.6', changefreq: 'weekly' },
	{ path: '/app/library', priority: '0.6', changefreq: 'weekly' },
	{ path: '/app/studio', priority: '0.6', changefreq: 'weekly' },
	{ path: '/app/analytics', priority: '0.5', changefreq: 'weekly' },
	{ path: '/app/agents', priority: '0.5', changefreq: 'monthly' }
];

export const GET: RequestHandler = () => {
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
		.map(
			(route) =>
				`  <url><loc>${SITE.url}${route.path}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`
		)
		.join('\n')}\n</urlset>`;
	return new Response(body, {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
	});
};
