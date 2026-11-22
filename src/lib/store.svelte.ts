import { browser } from '$app/environment';
import {
	analyzeCraft,
	countWords,
	generateChapterProse,
	generateChapters,
	generateConcept,
	generateCover,
	generateResearch,
	generateStoryBible,
	recountBook,
	defaultConfig,
	slugify
} from './engine';
import { createSeedState, DEMO_USER, PLAN_PRICE, uid } from './seed';
import type { Activity, AgentRun, AppState, Book, Chapter, User } from './types';

const KEY = 'scriptora.workspace.v1';

type BriefInput = {
	title: string;
	genre: string;
	audience: string;
	description: string;
	author: string;
	targetWords: number;
	chapters: number;
};

class StudioStore {
	state = $state<AppState>(createSeedState());
	ready = $state(false);
	sidebarOpen = $state(false);
	commandOpen = $state(false);
	toast = $state<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);

	init() {
		if (!browser || this.ready) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) this.state = JSON.parse(raw) as AppState;
		} catch {
			/* fall back to seed */
		}
		this.ready = true;
		document.documentElement.classList.add('dark');
	}

	persist() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(this.state));
		} catch {
			/* storage full or blocked */
		}
	}

	get user() {
		return this.state.user;
	}
	get authed() {
		return Boolean(this.state.user);
	}
	get hasAccess() {
		return Boolean(this.state.user) && this.state.onboarded && this.state.workspace.status === 'active';
	}
	get books() {
		return this.state.books;
	}
	get activeBooks() {
		return this.state.books.filter((b) => b.status !== 'archived');
	}
	get runs() {
		return this.state.runs;
	}
	get activity() {
		return [...this.state.activity].sort((a, b) => (a.at < b.at ? 1 : -1));
	}
	get totalWords() {
		return this.state.books.reduce((sum, b) => sum + b.wordCount, 0);
	}
	get liveRuns() {
		return this.state.runs.filter((r) => r.status === 'running' || r.status === 'queued');
	}

	book(id: string) {
		return this.state.books.find((b) => b.id === id);
	}

	login(email: string, name?: string, demo = false) {
		this.init();
		const existing = this.state.user;
		const derived = name?.trim() || email.split('@')[0].replace(/[._-]/g, ' ');
		const display = derived
			.split(' ')
			.filter(Boolean)
			.map((p) => p[0].toUpperCase() + p.slice(1))
			.join(' ');
		const user: User = existing
			? existing
			: {
					id: 'user-amara',
					name: display || 'Author',
					email,
					role: 'owner',
					initials:
						(display || 'A')
							.split(' ')
							.map((p) => p[0])
							.join('')
							.slice(0, 2)
							.toUpperCase() || 'AV',
					avatarHue: 38
				};
		this.state.user = user;
		if (demo) {
			this.state.onboarded = true;
			this.state.workspace.status = 'active';
		}
		this.addActivity({
			kind: 'member',
			title: demo ? 'Demo workspace opened' : 'Signed in',
			detail: demo ? 'Full enterprise workspace with sample catalogue.' : `${user.email} signed in to Venn & Co.`
		});
		this.persist();
	}

	logout() {
		this.state.user = null;
		this.persist();
	}

	activatePlan(email: string, company: string) {
		this.state.onboarded = true;
		this.state.workspace.status = 'active';
		if (company.trim()) this.state.workspace.name = company.trim();
		if (!this.state.workspace.invoices.some((i) => i.description.includes('Enterprise'))) {
			this.state.workspace.invoices.unshift({
				id: uid('inv'),
				number: `SCR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
				date: new Date().toISOString(),
				amount: PLAN_PRICE,
				status: 'paid',
				description: 'Scriptora Enterprise — annual subscription'
			});
		}
		this.state.workspace.renewal = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
		this.addActivity({
			kind: 'billing',
			title: 'Enterprise plan activated',
			detail: `$5,000.00 annual subscription · ${email}`
		});
		this.persist();
	}

	newBook(brief: BriefInput): Book {
		const concept = generateConcept({
			title: brief.title,
			genre: brief.genre,
			audience: brief.audience,
			description: brief.description,
			author: brief.author
		});
		const book: Book = {
			id: uid('book'),
			title: brief.title || concept.title,
			subtitle: concept.subtitle,
			author: brief.author || 'Amara Venn',
			genre: brief.genre,
			audience: brief.audience,
			language: 'English',
			description: brief.description || concept.description,
			logline: concept.logline,
			premise: concept.premise,
			themes: concept.themes,
			hooks: concept.hooks,
			usps: concept.usps,
			keywords: concept.keywords,
			status: 'active',
			stage: 'blueprint',
			targetWords: brief.targetWords,
			wordCount: 0,
			quality: 86,
			progress: 16,
			series: '',
			volume: 1,
			isbn: '',
			trimSize: '6 × 9 in',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			cover: generateCover({ title: brief.title || concept.title, subtitle: concept.subtitle, author: brief.author, genre: brief.genre }),
			bible: generateStoryBible(brief.title || concept.title, brief.genre),
			research: {} as Book['research'],
			craft: {} as Book['craft'],
			chapters: [],
			config: defaultConfig()
		};
		book.chapters = generateChapters(book, brief.chapters);
		book.research = generateResearch(book);
		book.craft = analyzeCraft(book);
		this.state.books.unshift(book);
		this.state.workspace.booksThisMonth += 1;
		this.addActivity({
			kind: 'draft',
			title: 'New book blueprint created',
			detail: `${book.title} · ${book.chapters.length} chapters planned`,
			bookId: book.id
		});
		this.persist();
		return book;
	}

	updateBook(id: string, patch: Partial<Book>) {
		const book = this.book(id);
		if (!book) return;
		Object.assign(book, patch);
		book.updatedAt = new Date().toISOString();
		recountBook(book);
		this.persist();
	}

	deleteBook(id: string) {
		const book = this.book(id);
		if (!book) return;
		this.state.books = this.state.books.filter((b) => b.id !== id);
		this.addActivity({ kind: 'edit', title: 'Book archived', detail: book.title });
		this.persist();
	}

	saveChapter(bookId: string, chapterId: string, content: string) {
		const book = this.book(bookId);
		const chapter = book?.chapters.find((c) => c.id === chapterId);
		if (!book || !chapter) return;
		chapter.content = content;
		chapter.wordCount = countWords(content);
		chapter.updatedAt = new Date().toISOString();
		if (chapter.status === 'planned') chapter.status = 'drafting';
		book.updatedAt = new Date().toISOString();
		book.stage = book.stage === 'outline' || book.stage === 'blueprint' ? 'drafting' : book.stage;
		recountBook(book);
		this.persist();
	}

	draftChapter(bookId: string, chapterId: string) {
		const book = this.book(bookId);
		const chapter = book?.chapters.find((c) => c.id === chapterId);
		if (!book || !chapter) return;
		chapter.content = generateChapterProse(book, chapter);
		chapter.wordCount = countWords(chapter.content);
		chapter.status = 'drafted';
		chapter.scenes = chapter.scenes.map((s) => ({ ...s, status: 'drafted' }));
		chapter.updatedAt = new Date().toISOString();
		book.stage = book.stage === 'concept' || book.stage === 'blueprint' || book.stage === 'outline' ? 'drafting' : book.stage;
		book.updatedAt = new Date().toISOString();
		book.craft = analyzeCraft(book);
		recountBook(book);
		this.addActivity({
			kind: 'draft',
			title: `Chapter ${chapter.number} drafted`,
			detail: `${chapter.title} · ${chapter.wordCount.toLocaleString()} words`,
			bookId
		});
		this.persist();
	}

	approveChapter(bookId: string, chapterId: string) {
		const book = this.book(bookId);
		const chapter = book?.chapters.find((c) => c.id === chapterId);
		if (!book || !chapter) return;
		chapter.status = 'approved';
		chapter.updatedAt = new Date().toISOString();
		book.stage = book.stage === 'drafting' ? 'editing' : book.stage;
		recountBook(book);
		this.persist();
	}

	regenerateBible(bookId: string) {
		const book = this.book(bookId);
		if (!book) return;
		book.bible = generateStoryBible(book.title + Date.now().toString(36), book.genre);
		book.updatedAt = new Date().toISOString();
		this.addActivity({ kind: 'agent', title: 'Story bible regenerated', detail: `${book.bible.characters.length} characters, ${book.bible.canon.length} canon rules`, bookId });
		this.persist();
	}

	regenerateResearch(bookId: string) {
		const book = this.book(bookId);
		if (!book) return;
		book.research = generateResearch(book);
		this.persist();
	}

	regenerateCraft(bookId: string) {
		const book = this.book(bookId);
		if (!book) return;
		book.craft = analyzeCraft(book);
		this.persist();
	}

	regenerateCover(bookId: string, style?: Partial<Book['cover']>) {
		const book = this.book(bookId);
		if (!book) return;
		book.cover = generateCover(book, style);
		this.persist();
	}

	setCover(bookId: string, patch: Partial<Book['cover']>) {
		const book = this.book(bookId);
		if (!book) return;
		book.cover = { ...book.cover, ...patch, updatedAt: new Date().toISOString() };
		this.persist();
	}

	addRun(run: AgentRun) {
		this.state.runs.unshift(run);
		this.persist();
	}

	updateRun(id: string, patch: Partial<AgentRun>) {
		const run = this.state.runs.find((r) => r.id === id);
		if (!run) return;
		Object.assign(run, patch);
		this.persist();
	}

	addActivity(activity: Omit<Activity, 'id' | 'at'> & { at?: string }) {
		this.state.activity.unshift({
			id: uid('act'),
			at: activity.at ?? new Date().toISOString(),
			...activity
		});
		if (this.state.activity.length > 80) this.state.activity.length = 80;
	}

	appendLog(runId: string, message: string, level: AgentRun['logs'][number]['level'] = 'info') {
		const run = this.state.runs.find((r) => r.id === runId);
		if (!run) return;
		run.logs.push({ t: new Date().toISOString(), level, message });
	}

	notify(message: string, kind: 'success' | 'error' | 'info' = 'success') {
		this.toast = { message, kind };
		if (browser) {
			setTimeout(() => {
				if (this.toast?.message === message) this.toast = null;
			}, 3600);
		}
	}

	inviteMember(name: string, email: string, role: string) {
		this.state.workspace.seatsUsed = Math.min(this.state.workspace.seats, this.state.workspace.seatsUsed + 1);
		this.addActivity({ kind: 'member', title: `${name || email} invited`, detail: `Role: ${role}` });
		this.persist();
	}

	bookSlug(book: Book) {
		return book.id || slugify(book.title);
	}
}

export const studio = new StudioStore();
