import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin } from '$lib/server/session';
import { sendEmail } from '$lib/server/convex';

export const POST: RequestHandler = async (event) => {
	const admin = await readAdmin(event);
	if (!admin) return json({ error: 'admin session required' }, { status: 401 });
	try {
		await sendEmail(event, {
			to: admin.email,
			subject: 'Scriptora live integration check',
			html: `<p>This is a live deliverability test from <strong>scriptora.ewinproject.org</strong>.</p><p>Convex state, AGNES generation, Cloudflare Pages and Resend are configured server-side.</p>`
		});
		return json({ ok: true });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Email failed' }, { status: 502 });
	}
};
