import { internalAction } from './_generated/server';
import { v } from 'convex/values';

const DEFAULT_BASE = 'https://apihub.agnes-ai.com/v1';
const DEFAULT_MODEL = 'agnes-3.0-flash';

/**
 * Primary managed-intelligence path. The key lives only in Convex env; browser
 * clients never see it. The SvelteKit server proxies through a signed HTTP
 * action, and the deterministic studio engine remains the fallback.
 */
export const generateChapter = internalAction({
	args: {
		bookTitle: v.string(),
		genre: v.string(),
		audience: v.string(),
		chapterTitle: v.string(),
		summary: v.string(),
		purpose: v.string(),
		targetWords: v.number(),
		voice: v.optional(v.string()),
		model: v.optional(v.string())
	},
	handler: async (_ctx, args) => {
		const key = process.env.AGNES_AI_KEY;
		if (!key) throw new Error('AGNES_AI_KEY is not configured');
		const base = (process.env.AGNES_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
		const model = args.model ?? process.env.AGNES_MODEL ?? DEFAULT_MODEL;
		const target = Math.max(900, Math.min(args.targetWords || 2400, 8000));

		const system = [
			'You are Scriptora, an enterprise book-production studio.',
			'Write publishable manuscript prose, not an outline, not commentary, and not a summary.',
			'Return Markdown only. Start with a single # chapter heading. Use scene breaks as ***.',
			'Honour the story bible facts implied by the brief. Do not invent a different protagonist name.',
			'Avoid AI-isms: no "in a world where", no "it was not just X, it was Y", no symmetrical three-item lists, no explanatory epilogue.',
			'Vary paragraph length. Let dialogue interrupt exposition. Keep the voice specific to the genre.',
			args.voice ? `Voice contract: ${args.voice}` : ''
		]
			.filter(Boolean)
			.join(' ');

		const prompt = [
			`Book: ${args.bookTitle}`,
			`Genre: ${args.genre}`,
			`Audience: ${args.audience}`,
			`Chapter: ${args.chapterTitle}`,
			`Chapter purpose: ${args.purpose}`,
			`Scene brief: ${args.summary}`,
			`Target length: approximately ${target} words.`,
			'Write the complete chapter now.'
		].join('\n');

		const res = await fetch(`${base}/chat/completions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: prompt }
				],
				temperature: 0.78,
				max_tokens: Math.min(8192, Math.max(2048, Math.round(target * 1.7)))
			})
		});

		if (!res.ok) {
			const detail = await res.text();
			throw new Error(`AGNES ${res.status}: ${detail.slice(0, 500)}`);
		}
		const body = (await res.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
			usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
		};
		const text = body.choices?.[0]?.message?.content?.trim();
		if (!text) throw new Error('AGNES returned an empty completion');
		return {
			text,
			model,
			usage: body.usage ?? null,
			provider: 'agnes'
		};
	}
});
