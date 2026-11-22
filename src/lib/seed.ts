import {
	analyzeCraft,
	generateChapterProse,
	generateChapters,
	generateConcept,
	generateCover,
	generateResearch,
	generateStoryBible,
	defaultConfig,
	recountBook
} from './engine';
import type { Activity, AgentRun, AppState, Book, Chapter, Workspace } from './types';

export const PLAN_PRICE = 5000;
const now = Date.now();
const iso = (daysAgo: number, hoursAgo = 0) =>
	new Date(now - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString();

export function uid(prefix = 'id') {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildBook(partial: Partial<Book> & { title: string; genre: string; audience: string; author: string }): Book {
	const concept = generateConcept({
		title: partial.title,
		genre: partial.genre,
		audience: partial.audience,
		description: partial.description,
		author: partial.author
	});
	const bible = partial.bible ?? generateStoryBible(partial.title, partial.genre);
	const base: Book = {
		id: partial.id ?? uid('book'),
		title: partial.title,
		subtitle: partial.subtitle ?? concept.subtitle,
		author: partial.author,
		genre: partial.genre,
		audience: partial.audience,
		language: 'English',
		description: partial.description ?? concept.description,
		logline: partial.logline ?? concept.logline,
		premise: partial.premise ?? concept.premise,
		themes: partial.themes ?? concept.themes,
		hooks: partial.hooks ?? concept.hooks,
		usps: partial.usps ?? concept.usps,
		keywords: partial.keywords ?? concept.keywords,
		status: partial.status ?? 'active',
		stage: partial.stage ?? 'outline',
		targetWords: partial.targetWords ?? 72000,
		wordCount: 0,
		quality: 88,
		progress: 30,
		series: partial.series ?? '',
		volume: partial.volume ?? 1,
		isbn: partial.isbn ?? '',
		trimSize: partial.trimSize ?? '6 × 9 in',
		createdAt: partial.createdAt ?? iso(30),
		updatedAt: partial.updatedAt ?? iso(1),
		cover:
			partial.cover ??
			generateCover({ title: partial.title, subtitle: concept.subtitle, author: partial.author, genre: partial.genre }),
		bible,
		research: partial.research ?? ({} as Book['research']),
		craft: partial.craft ?? ({} as Book['craft']),
		chapters: partial.chapters ?? [],
		config: partial.config ?? defaultConfig(),
		publishedAt: partial.publishedAt
	};
	if (!base.chapters.length) {
		base.chapters = generateChapters(base, partial.genre === 'Nonfiction' ? 10 : 12);
	}
	if (!base.research.keywords?.length) base.research = generateResearch(base);
	if (!base.craft.protocols?.length) base.craft = analyzeCraft(base);
	return base;
}

function draftChapters(book: Book, upto: number, status: Chapter['status'][]): Book {
	for (const chapter of book.chapters.slice(0, upto)) {
		chapter.content = generateChapterProse(book, chapter);
		chapter.status = status[chapter.number - 1] ?? 'drafted';
		chapter.updatedAt = iso(8 - Math.min(7, chapter.number));
		chapter.scenes = chapter.scenes.map((s) => ({ ...s, status: chapter.number <= upto ? 'drafted' : 'planned' }));
	}
	return recountBook(book);
}

export function createSeedState(): AppState {
	const flagship = buildBook({
		id: 'book-cartographer',
		title: 'The Cartographer of Silence',
		genre: 'Literary Fiction',
		audience: 'Upmarket book-club readers',
		author: 'Amara Venn',
		description:
			'When a restoration archivist discovers a map of a demolished district that should not exist, she must choose between protecting the institution that made her and the people it erased.',
		stage: 'editing',
		status: 'active',
		targetWords: 78000,
		series: 'The Archive Duology',
		volume: 1,
		createdAt: iso(64),
		updatedAt: iso(0, 2)
	});
	flagship.subtitle = 'Every institution keeps a second record.';
	flagship.themes = [
		'memory and the stories we edit',
		'inheritance, chosen and refused',
		'the ethics of care',
		'the private life of institutions'
	];
	flagship.chapters = flagship.chapters.map((c) => ({
		...c,
		part: c.number <= 4 ? 'Part I — The Ordinary World' : c.number <= 8 ? 'Part II — The Crossing' : 'Part III — The Return'
	}));
	draftChapters(flagship, 9, [
		'approved',
		'approved',
		'approved',
		'edited',
		'edited',
		'drafted',
		'drafted',
		'drafted',
		'edited',
		'planned',
		'planned',
		'planned'
	]);
	flagship.craft = {
		...flagship.craft,
		aiismScore: 94,
		readability: 64,
		continuity: [
			{
				severity: 'medium',
				message: 'Elias’s tenure is stated as eight years in Ch 2 and seven in Ch 7.',
				where: 'Ch 2, Ch 7'
			},
			{ severity: 'low', message: 'The river path is described as north of the archive twice; once as south.', where: 'Ch 4' },
			{
				severity: 'high',
				message: 'The closure report is quoted in Ch 9 before its provenance is established.',
				where: 'Ch 9'
			}
		]
	};
	flagship.cover = generateCover(flagship, { palette: 'midnight', motif: 'rings', typography: 'editorial' });
	flagship.quality = 91;
	flagship.progress = 74;

	const nonfiction = buildBook({
		id: 'book-attention',
		title: 'The Attention Ledger',
		subtitle: 'A practical operating system for teams that make things',
		genre: 'Nonfiction',
		audience: 'Operators and team leads at growing companies',
		author: 'Amara Venn',
		stage: 'drafting',
		status: 'active',
		targetWords: 54000,
		series: '',
		createdAt: iso(41),
		updatedAt: iso(2)
	});
	nonfiction.themes = [
		'attention as a budget',
		'the hidden cost of coordination',
		'decision hygiene',
		'systems that survive their creators'
	];
	nonfiction.chapters = nonfiction.chapters.map((c) => ({
		...c,
		part: c.number <= 3 ? 'Part I — The Ledger' : c.number <= 7 ? 'Part II — The Practice' : 'Part III — The Institution'
	}));
	draftChapters(nonfiction, 4, ['approved', 'edited', 'drafted', 'drafting']);
	nonfiction.craft = { ...nonfiction.craft, aiismScore: 96, readability: 59 };
	nonfiction.cover = generateCover(nonfiction, { palette: 'parchment', motif: 'grid', typography: 'modern' });
	nonfiction.progress = 48;

	const third = buildBook({
		id: 'book-salthouse',
		title: 'Salt Houses',
		subtitle: 'A novel of inheritance and weather',
		genre: 'Literary Fiction',
		audience: 'Readers of family sagas',
		author: 'Amara Venn',
		stage: 'outline',
		status: 'draft',
		targetWords: 84000,
		series: 'The Archive Duology',
		volume: 2,
		createdAt: iso(12),
		updatedAt: iso(3)
	});
	third.cover = generateCover(third, { palette: 'oxide', motif: 'waves', typography: 'classic' });
	third.chapters.forEach((c) => (c.status = 'planned'));
	third.progress = 31;

	const fourth = buildBook({
		id: 'book-fog',
		title: 'A Field Guide to Fog',
		subtitle: 'Essays on attention, weather, and not knowing',
		genre: 'Essays',
		audience: 'General nonfiction readers',
		author: 'Amara Venn',
		stage: 'concept',
		status: 'draft',
		targetWords: 42000,
		createdAt: iso(4),
		updatedAt: iso(4)
	});
	fourth.cover = generateCover(fourth, { palette: 'bone', motif: 'arch', typography: 'brutalist' });
	fourth.progress = 8;

	const published = buildBook({
		id: 'book-inventory',
		title: 'The Long Inventory',
		subtitle: 'A novel',
		genre: 'Literary Fiction',
		audience: 'Book club readers',
		author: 'Amara Venn',
		stage: 'published',
		status: 'complete',
		targetWords: 70000,
		createdAt: iso(420),
		updatedAt: iso(88),
		publishedAt: iso(88)
	});
	published.cover = generateCover(published, { palette: 'forest', motif: 'botanical', typography: 'editorial' });
	published.progress = 100;
	published.quality = 94;
	published.chapters = published.chapters.map((c) => ({ ...c, status: 'approved', wordCount: Math.round(70214 / 12) }));

	const books = [flagship, nonfiction, third, fourth, published];

	const runs: AgentRun[] = [
		{
			id: 'run-1',
			bookId: 'book-cartographer',
			bookTitle: 'The Cartographer of Silence',
			pipeline: 'Editorial & Continuity Pass',
			status: 'paused',
			progress: 62,
			startedAt: iso(0, 1),
			cost: 4.82,
			tokens: 186_400,
			model: 'studio-prose-1',
			steps: [
				{ name: 'Load canon + narrative graph', status: 'done', detail: '42 entities, 18 invariants' },
				{ name: 'Line edit chapters 1–9', status: 'done', detail: '9 chapters, 48,620 words' },
				{ name: 'Continuity audit', status: 'done', detail: '3 findings' },
				{ name: 'Resolve high-severity finding', status: 'running', detail: 'Ch 9 provenance gap' },
				{ name: 'Pacing report', status: 'pending' },
				{ name: 'Re-run AI-ism sweep', status: 'pending' }
			],
			logs: [
				{ t: iso(0, 1), level: 'info', message: 'Run started with canon lock v3.4. 18 invariants loaded.' },
				{ t: iso(0, 0.8), level: 'ok', message: 'Chapters 1–9 line-edited. 412 suggestions accepted.' },
				{
					t: iso(0, 0.6),
					level: 'warn',
					message: 'High-severity continuity finding: Ch 9 quotes a document introduced in Ch 10.'
				},
				{
					t: iso(0, 0.4),
					level: 'warn',
					message: 'Run paused for human decision. Choose: move reveal, add provenance scene, or soften quote.'
				}
			]
		},
		{
			id: 'run-2',
			bookId: 'book-attention',
			bookTitle: 'The Attention Ledger',
			pipeline: 'Full draft · Chapters 5–7',
			status: 'complete',
			progress: 100,
			startedAt: iso(2, 3),
			finishedAt: iso(2, 1),
			cost: 6.14,
			tokens: 241_800,
			model: 'studio-prose-1',
			steps: [
				{ name: 'Refresh research index', status: 'done', detail: '12 sources' },
				{ name: 'Draft Ch 5', status: 'done', detail: '2,840 words' },
				{ name: 'Draft Ch 6', status: 'done', detail: '3,102 words' },
				{ name: 'Draft Ch 7', status: 'done', detail: '2,960 words' },
				{ name: 'Editorial pass', status: 'done', detail: '3 chapters' }
			],
			logs: [
				{ t: iso(2, 3), level: 'info', message: 'Pipeline started. Style anchor applied before every chapter.' },
				{ t: iso(2, 2.4), level: 'ok', message: 'Ch 5 complete. Continuity check passed (0 blockers).' },
				{ t: iso(2, 1.8), level: 'ok', message: 'Ch 6 complete. 2 factual claims flagged for citation.' },
				{ t: iso(2, 1.1), level: 'ok', message: 'Ch 7 complete. Editorial pass applied 96 suggestions.' },
				{ t: iso(2, 1), level: 'ok', message: 'Run complete. Cost $6.14 across 241.8k tokens.' }
			]
		},
		{
			id: 'run-3',
			bookId: 'book-salthouse',
			bookTitle: 'Salt Houses',
			pipeline: 'Blueprint from brief',
			status: 'complete',
			progress: 100,
			startedAt: iso(6, 2),
			finishedAt: iso(6, 1),
			cost: 1.36,
			tokens: 48_200,
			model: 'studio-architect-1',
			steps: [
				{ name: 'Concept synthesis', status: 'done' },
				{ name: 'Character system', status: 'done', detail: '6 characters' },
				{ name: 'World bible', status: 'done', detail: '6 entries' },
				{ name: 'Chapter plan', status: 'done', detail: '12 chapters' }
			],
			logs: [
				{ t: iso(6, 2), level: 'info', message: 'Blueprint pipeline started.' },
				{
					t: iso(6, 1.4),
					level: 'ok',
					message: 'Blueprint approved automatically (supervised mode, no blockers).'
				},
				{ t: iso(6, 1), level: 'ok', message: 'Run complete. 12 chapters planned, 36 scenes mapped.' }
			]
		}
	];

	const activity: Activity[] = [
		{
			id: 'a1',
			kind: 'agent',
			title: 'Editorial pass paused',
			detail: 'One high-severity continuity finding needs a human decision.',
			at: iso(0, 0.4),
			bookId: 'book-cartographer'
		},
		{
			id: 'a2',
			kind: 'edit',
			title: 'Chapter 9 approved',
			detail: '“The Quiet Part” — 4,210 words, quality 93.',
			at: iso(0, 3),
			bookId: 'book-cartographer'
		},
		{
			id: 'a3',
			kind: 'draft',
			title: '3 chapters drafted',
			detail: 'The Attention Ledger chapters 5–7 are ready for review.',
			at: iso(2, 1),
			bookId: 'book-attention'
		},
		{
			id: 'a4',
			kind: 'design',
			title: 'Cover direction selected',
			detail: 'Midnight / rings / editorial. Back cover copy approved.',
			at: iso(3, 4),
			bookId: 'book-cartographer'
		},
		{
			id: 'a5',
			kind: 'export',
			title: 'EPUB exported',
			detail: 'The Long Inventory — 412 KB, validation passed.',
			at: iso(88),
			bookId: 'book-inventory'
		},
		{
			id: 'a6',
			kind: 'member',
			title: 'Nadia Okoro joined',
			detail: 'Invited as editor with manuscript permissions.',
			at: iso(9)
		},
		{ id: 'a7', kind: 'billing', title: 'Enterprise plan renewed', detail: '$5,000.00 annual subscription paid.', at: iso(34) }
	];

	const workspace: Workspace = {
		id: 'ws-scriptora',
		name: 'Venn & Co. Publishing',
		plan: 'enterprise',
		seats: 10,
		seatsUsed: 3,
		price: PLAN_PRICE,
		currency: 'USD',
		interval: 'year',
		renewal: new Date(now + 331 * 86_400_000).toISOString().slice(0, 10),
		status: 'active',
		booksThisMonth: 3,
		wordsThisMonth: 72_480,
		aiCreditsUsed: 61,
		aiCreditsTotal: 100,
		invoices: [
			{
				id: 'inv-1',
				number: 'SCR-2026-0041',
				date: iso(34),
				amount: PLAN_PRICE,
				status: 'paid',
				description: 'Scriptora Enterprise — annual subscription'
			},
			{
				id: 'inv-2',
				number: 'SCR-2025-0032',
				date: iso(399),
				amount: PLAN_PRICE,
				status: 'paid',
				description: 'Scriptora Enterprise — annual subscription'
			}
		],
		providers: [
			{
				id: 'scriptora',
				name: 'Scriptora Engine',
				connected: true,
				models: ['studio-prose-1', 'studio-architect-1', 'studio-editor-1'],
				lastUsed: iso(0, 1)
			},
			{ id: 'openai', name: 'OpenAI', connected: true, models: ['gpt-5', 'gpt-4o', 'o4-mini'], lastUsed: iso(2) },
			{ id: 'anthropic', name: 'Anthropic', connected: true, models: ['claude-opus-4-5', 'claude-sonnet-4-5'], lastUsed: iso(6) },
			{ id: 'google', name: 'Google', connected: false, models: ['gemini-2.5-pro', 'gemini-2.0-flash'] },
			{ id: 'openrouter', name: 'OpenRouter', connected: false, models: ['auto', 'deepseek-chat', 'mistral-large'] }
		]
	};

	return {
		user: null,
		workspace,
		books,
		runs,
		activity,
		onboarded: false,
		createdAt: iso(400)
	};
}

export const DEMO_USER = {
	id: 'user-amara',
	name: 'Amara Venn',
	email: 'amara@venn.co',
	role: 'owner' as const,
	initials: 'AV',
	avatarHue: 38
};
