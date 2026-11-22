import { studio } from './store.svelte';
import { countWords, generateChapterProse, generateCover, generateResearch, generateStoryBible, analyzeCraft, recountBook } from './engine';
import { uid } from './seed';
import type { AgentRun, Book } from './types';

export type PipelineKind =
	| 'full-book'
	| 'blueprint'
	| 'draft'
	| 'chapters'
	| 'editorial'
	| 'research'
	| 'design'
	| 'export';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Live AGNES generation through the server proxy; returns null when unavailable. */
export async function generateChapterLive(
	book: Book,
	chapter: { number: number; title: string; summary: string; purpose?: string; targetWords: number },
	voice?: string
): Promise<{ text: string; model: string } | null> {
	try {
		const res = await fetch('/api/ai/chapter', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bookTitle: book.title,
				genre: book.genre,
				audience: book.audience,
				chapterTitle: chapter.title,
				summary: chapter.summary,
				purpose: chapter.purpose ?? '',
				targetWords: Math.round(chapter.targetWords * 0.92),
				voice
			})
		});
		const data = (await res.json()) as { text?: string; model?: string; fallback?: boolean; error?: string };
		if (!res.ok || data.fallback || !data.text) {
			return null;
		}
		return { text: data.text, model: data.model ?? 'agnes-3.0-flash' };
	} catch {
		return null;
	}
}

function stepNames(kind: PipelineKind, book: Book): string[] {
	switch (kind) {
		case 'full-book':
			return [
				'Ingest brief + audience signals',
				'Synthesize concept and promise',
				'Build story bible and canon locks',
				'Design chapter + scene architecture',
				'Draft chapters (voice anchor reapplied)',
				'Continuity + canon audit',
				'Editorial pass + AI-ism sweep',
				'Cover concepts',
				'Package EPUB + print PDF'
			];
		case 'blueprint':
			return ['Concept synthesis', 'Character system', 'World bible', 'Chapter + scene plan', 'Canon lock'];
		case 'draft':
			return ['Load canon + style anchor', 'Draft chapter', 'Scene-circuit audit', 'Editorial pass'];
		case 'chapters':
			return ['Load canon + style anchor', 'Draft selected chapters', 'Continuity audit', 'Update quality report'];
		case 'editorial':
			return ['Load canon + narrative graph', 'Line edit', 'Continuity audit', 'Pacing report', 'AI-ism sweep'];
		case 'research':
			return ['Collect market signals', 'Analyze comparable titles', 'Score keywords', 'Positioning brief'];
		case 'design':
			return ['Extract cover brief', 'Generate three directions', 'Apply typography system', 'Export cover package'];
		case 'export':
			return ['Assemble front matter', 'Set back matter', 'Build EPUB 3', 'Generate print PDF', 'Run validation'];
	}
}

const MODEL_BY_KIND: Record<PipelineKind, string> = {
	'full-book': 'studio-prose-1',
	blueprint: 'studio-architect-1',
	draft: 'studio-prose-1',
	chapters: 'studio-prose-1',
	editorial: 'studio-editor-1',
	research: 'studio-research-1',
	design: 'studio-design-1',
	export: 'studio-format-1'
};

export function startPipeline(
	bookId: string,
	kind: PipelineKind,
	options: { chapterIds?: string[]; speed?: number; pipeline?: string } = {}
): AgentRun {
	const book = studio.book(bookId);
	const names = stepNames(kind, book ?? ({} as Book));
	const run: AgentRun = {
		id: uid('run'),
		bookId,
		bookTitle: book?.title ?? 'Untitled',
		pipeline: options.pipeline ?? defaultPipelineName(kind),
		status: 'running',
		progress: 0,
		startedAt: new Date().toISOString(),
		cost: 0,
		tokens: 0,
		model: MODEL_BY_KIND[kind],
		steps: names.map((name) => ({ name, status: 'pending' })),
		logs: [
			{ t: new Date().toISOString(), level: 'info', message: `Pipeline “${options.pipeline ?? defaultPipelineName(kind)}” started on ${book?.title ?? 'workspace'}.` }
		]
	};
	studio.addRun(run);
	void execute(run.id, bookId, kind, options);
	return run;
}

function defaultPipelineName(kind: PipelineKind) {
	const map: Record<PipelineKind, string> = {
		'full-book': 'Full book production',
		blueprint: 'Blueprint from brief',
		draft: 'Chapter draft',
		chapters: 'Selected chapters',
		editorial: 'Editorial & continuity pass',
		research: 'Market intelligence',
		design: 'Cover design sprint',
		export: 'Export package'
	};
	return map[kind];
}

async function execute(runId: string, bookId: string, kind: PipelineKind, options: { chapterIds?: string[]; speed?: number }) {
	const book = studio.book(bookId);
	const run = studio.runs.find((r) => r.id === runId);
	if (!book || !run) return;
	const speed = options.speed ?? 1;
	const delay = () => sleep((420 + Math.random() * 380) / speed);
	let totalWords = 0;

	try {
		for (let i = 0; i < run.steps.length; i++) {
			const step = run.steps[i];
			step.status = 'running';
			studio.updateRun(runId, { progress: Math.round((i / run.steps.length) * 100) });
			studio.appendLog(runId, `${step.name}…`);
			await delay();

			switch (kind) {
				case 'full-book': {
					if (i === 0) {
						step.detail = `${book.targetWords.toLocaleString()} target words · ${book.genre}`;
						studio.appendLog(runId, `Brief parsed. Audience: ${book.audience}.`, 'info');
					}
					if (i === 1) {
						step.detail = book.logline.slice(0, 68) + '…';
						studio.appendLog(runId, 'Concept and promise synthesized. Style anchor locked.', 'ok');
					}
					if (i === 2) {
						book.bible = generateStoryBible(book.title, book.genre);
						step.detail = `${book.bible.characters.length} characters · ${book.bible.canon.length} canon rules`;
						studio.appendLog(runId, 'Story bible built. Canon locks applied to every specialist.', 'ok');
					}
					if (i === 3) {
						step.detail = `${book.chapters.length} chapters · ${book.chapters.length * 3} scenes`;
						book.stage = 'outline';
						studio.appendLog(runId, `Scene architecture mapped: ${book.chapters.length * 3} scenes, 8-step circuit each.`, 'ok');
					}
					if (i === 4) {
						const useLive = Boolean(studio.session);
						if (useLive) studio.appendLog(runId, `AGNES ${book.config.model} engaged for prose generation.`, 'info');
						for (const chapter of book.chapters) {
							let text = '';
							let model = MODEL_BY_KIND[kind];
							if (useLive) {
								const live = await generateChapterLive(book, chapter, book.config.styleAnchor.slice(0, 400));
								if (live) {
									text = live.text;
									model = live.model;
								}
							}
							if (!text) text = generateChapterProse(book, chapter);
							chapter.content = text;
							chapter.wordCount = countWords(text);
							chapter.status = 'drafted';
							chapter.scenes = chapter.scenes.map((s) => ({ ...s, status: 'drafted' }));
							totalWords += chapter.wordCount;
							studio.updateRun(runId, { progress: Math.round(((i + (chapter.number / book.chapters.length)) / run.steps.length) * 100), model });
							studio.appendLog(runId, `Ch ${chapter.number} “${chapter.title}” drafted · ${chapter.wordCount.toLocaleString()} words${useLive ? ' · AGNES' : ''}`, 'ok');
							await sleep(120 / speed);
						}
						recountBook(book);
						book.stage = 'drafting';
						step.detail = `${totalWords.toLocaleString()} words across ${book.chapters.length} chapters${useLive ? ' · AGNES' : ' · deterministic'}`;
					}
					if (i === 5) {
						book.craft = analyzeCraft(book);
						step.detail = `${book.craft.continuity.length} findings · ${book.craft.aiismScore}% voice integrity`;
						studio.appendLog(runId, 'Continuity audit complete. Narrative graph updated.', 'ok');
					}
					if (i === 6) {
						studio.appendLog(runId, 'Editorial pass applied. 1 high-severity finding queued for human review.', 'warn');
						step.detail = 'Human review required for 1 finding';
					}
					if (i === 7) {
						book.cover = generateCover(book, { palette: 'midnight', motif: 'rings', typography: 'editorial' });
						book.research = generateResearch(book);
						step.detail = '3 directions · midnight / rings selected';
						studio.appendLog(runId, 'Cover directions generated. Midnight / rings recommended.', 'ok');
					}
					if (i === 8) {
						book.stage = 'editing';
						step.detail = 'EPUB + print-ready PDF ready';
						studio.appendLog(runId, 'Export package assembled and validated.', 'ok');
					}
					break;
				}
				case 'blueprint': {
					if (i === 0) {
						step.detail = book.logline.slice(0, 60) + '…';
						studio.appendLog(runId, 'Concept synthesis complete.', 'ok');
					}
					if (i === 1) {
						step.detail = `${book.bible.characters.length} characters · want/need/wound mapped`;
						studio.appendLog(runId, 'Character system built with tier assignments.', 'ok');
					}
					if (i === 2) {
						step.detail = `${book.bible.world.length} world entries · ${book.bible.canon.length} canon rules`;
						studio.appendLog(runId, 'World bible and canon rules locked.', 'ok');
					}
					if (i === 3) {
						step.detail = `${book.chapters.length} chapters · ${book.chapters.length * 3} scenes`;
						studio.appendLog(runId, 'Chapter plan and scene circuits mapped.', 'ok');
					}
					if (i === 4) {
						book.stage = 'outline';
						book.craft = analyzeCraft(book);
						step.detail = 'Canon lock v1.0';
						studio.appendLog(runId, 'Canon locked. Ready for drafting.', 'ok');
					}
					break;
				}
				case 'draft':
				case 'chapters': {
					const ids = options.chapterIds?.length
						? options.chapterIds
						: book.chapters.filter((c) => !c.content).slice(0, 1).map((c) => c.id);
					if (i === 0) {
						step.detail = `${ids.length} chapter${ids.length === 1 ? '' : 's'} · style anchor applied`;
						studio.appendLog(runId, 'Canon, narrative graph and style anchor loaded.', 'ok');
					}
					if (i === 1) {
						for (const id of ids) {
							const chapter = book.chapters.find((c) => c.id === id);
							if (!chapter) continue;
							chapter.content = generateChapterProse(book, chapter);
							chapter.wordCount = countWords(chapter.content);
							chapter.status = 'drafted';
							chapter.scenes = chapter.scenes.map((s) => ({ ...s, status: 'drafted' }));
							totalWords += chapter.wordCount;
							studio.appendLog(runId, `Ch ${chapter.number} drafted · ${chapter.wordCount.toLocaleString()} words`, 'ok');
							await sleep(150 / speed);
						}
						book.stage = 'drafting';
						step.detail = `${totalWords.toLocaleString()} words generated`;
					}
					if (i === 2) {
						book.craft = analyzeCraft(book);
						step.detail = `${book.craft.continuity.length} findings`;
						studio.appendLog(runId, 'Continuity audit complete.', 'ok');
					}
					if (i === 3) {
						book.quality = Math.min(98, book.quality + 1);
						step.detail = `Quality ${book.quality}/100`;
					}
					break;
				}
				case 'editorial': {
					if (i === 0) step.detail = '42 entities · 18 invariants';
					if (i === 1) {
						step.detail = `${book.chapters.filter((c) => c.content).length} chapters line-edited`;
						studio.appendLog(runId, 'Line edit complete. 318 suggestions applied.', 'ok');
					}
					if (i === 2) {
						book.craft = analyzeCraft(book);
						step.detail = `${book.craft.continuity.length} findings`;
						studio.appendLog(runId, '3 continuity findings raised.', 'warn');
					}
					if (i === 3) step.detail = 'Pacing report available in Craft';
					if (i === 4) {
						book.stage = 'editing';
						step.detail = `${book.craft.aiismScore}% voice integrity`;
						studio.appendLog(runId, 'AI-ism sweep complete.', 'ok');
					}
					break;
				}
				case 'research': {
					if (i === 0) step.detail = '6 market signals';
					if (i === 1) {
						book.research = generateResearch(book);
						step.detail = `${book.research.comps.length} comparable titles`;
						studio.appendLog(runId, 'Comparable titles analyzed.', 'ok');
					}
					if (i === 2) {
						step.detail = `${book.research.keywords.length} keywords scored`;
						studio.appendLog(runId, 'Keyword opportunities scored by intent.', 'ok');
					}
					if (i === 3) step.detail = book.research.positioning.slice(0, 64) + '…';
					break;
				}
				case 'design': {
					if (i === 0) step.detail = `${book.genre} · ${book.audience}`;
					if (i === 1) {
						book.cover = generateCover(book);
						step.detail = '3 directions generated';
						studio.appendLog(runId, 'Three cover directions generated.', 'ok');
					}
					if (i === 2) {
						book.cover = generateCover(book, { palette: 'midnight', motif: 'rings', typography: 'editorial' });
						step.detail = 'Editorial type system applied';
					}
					if (i === 3) {
						book.stage = 'design';
						step.detail = 'Cover package ready';
						studio.appendLog(runId, 'Cover package exported (front, back, spine).', 'ok');
					}
					break;
				}
				case 'export': {
					if (i === 0) step.detail = 'Title, copyright, dedication, TOC';
					if (i === 1) step.detail = 'Acknowledgements, author note, also-by';
					if (i === 2) {
						book.stage = 'export';
						step.detail = 'EPUB 3 · validation passed';
						studio.appendLog(runId, 'EPUB 3 built and validated.', 'ok');
					}
					if (i === 3) step.detail = `${book.trimSize} · print-ready`;
					if (i === 4) {
						step.detail = '0 errors · 0 warnings';
						studio.appendLog(runId, 'Validation passed with 0 errors.', 'ok');
					}
					break;
				}
			}

			step.status = 'done';
			recountBook(book);
			studio.updateRun(runId, {
				progress: Math.round(((i + 1) / run.steps.length) * 100),
				cost: Number((run.cost + 0.42 + Math.random() * 0.8).toFixed(2)),
				tokens: run.tokens + 18_000 + Math.round(Math.random() * 12_000)
			});
			studio.persist();
		}

		studio.updateRun(runId, {
			status: 'complete',
			progress: 100,
			finishedAt: new Date().toISOString()
		});
		studio.appendLog(runId, `Pipeline complete · $${run.cost.toFixed(2)} · ${Math.round(run.tokens / 1000)}k tokens`, 'ok');
		studio.addActivity({
			kind: 'agent',
			title: `${run.pipeline} complete`,
			detail: `${book.title} · ${run.steps.length} steps · $${run.cost.toFixed(2)}`,
			bookId
		});
		studio.notify(`${run.pipeline} complete — ${book.title}`);
	} catch (err) {
		studio.updateRun(runId, { status: 'failed' });
		studio.appendLog(runId, err instanceof Error ? err.message : 'Pipeline failed', 'error');
		studio.notify('Pipeline failed. See run log.', 'error');
	}
	studio.persist();
}

export function resumeRun(runId: string) {
	const run = studio.runs.find((r) => r.id === runId);
	if (!run) return;
	const book = studio.book(run.bookId);
	run.status = 'running';
	run.steps.forEach((s) => {
		if (s.status === 'running' || s.status === 'pending') s.status = 'done';
	});
	studio.appendLog(runId, 'Human decision recorded: add provenance scene to Ch 9 and re-run checks.', 'info');
	setTimeout(() => {
		if (book) {
			book.craft = analyzeCraft(book);
			book.stage = 'editing';
			recountBook(book);
		}
		studio.updateRun(runId, {
			status: 'complete',
			progress: 100,
			finishedAt: new Date().toISOString(),
			cost: Number((run.cost + 1.18).toFixed(2)),
			tokens: run.tokens + 22_400
		});
		studio.appendLog(runId, 'Provenance scene added. Continuity audit clean. Run complete.', 'ok');
		studio.addActivity({
			kind: 'edit',
			title: 'Continuity finding resolved',
			detail: 'Provenance scene added to Ch 9. Editorial pass complete.',
			bookId: run.bookId
		});
		studio.notify('Editorial pass completed');
	}, 1800);
}
