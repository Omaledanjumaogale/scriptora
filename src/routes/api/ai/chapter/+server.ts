import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin, readUser } from '$lib/server/session';
import { generateChapter, ConvexError } from '$lib/server/convex';

export const POST: RequestHandler = async (event) => {
	const [user, admin] = await Promise.all([readUser(event), readAdmin(event)]);
	if (!user && !admin) return json({ error: 'sign in required', fallback: true }, { status: 401 });
	let body: Record<string, unknown>;
	try {
		body = (await event.request.json()) as Record<string, unknown>;
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}
	const targetWords = Math.max(600, Math.min(Number(body.targetWords ?? 2400), 8000));
	try {
		const result = await generateChapter(event, {
			bookTitle: String(body.bookTitle ?? 'Untitled'),
			genre: String(body.genre ?? 'Literary Fiction'),
			audience: String(body.audience ?? 'General readers'),
			chapterTitle: String(body.chapterTitle ?? 'Chapter'),
			summary: String(body.summary ?? ''),
			purpose: String(body.purpose ?? ''),
			targetWords,
			voice: body.voice ? String(body.voice) : undefined,
			model: body.model ? String(body.model) : undefined
		});
		return json({
			...result,
			provider: 'agnes',
			live: true,
			fallback: false
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Generation failed';
		return json(
			{
				error: message,
				fallback: true,
				live: false,
				status: error instanceof ConvexError ? error.status : 502
			},
			{ status: 200 }
		);
	}
};
