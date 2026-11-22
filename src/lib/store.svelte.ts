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

export type SyncStatus = 'mock' | 'connecting' | 'live' | 'saving' | 'offline';
export type LiveSession = {
	email: string;
	name: string;
	avatar?: string;
	provider: 'google' | 'github';
	workspaceKey: string;
};

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
	syncStatus = $state<SyncStatus>('mock');
	syncError = $state('');
	session = $state<LiveSession | null>(null);
	authResolved = $state(false);

	private syncTimer: ReturnType<typeof setTimeout> | null = null;
	private suppressSync = false;

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
		void this.bootstrapLive();
	}

	private async bootstrapLive() {
		if (!browser) return;
		this.syncStatus = 'connecting';
		try {
			const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
			if (!res.ok) throw new Error('Session endpoint unavailable');
			const data = (await res.json()) as {
				authenticated: boolean;
				user?: { email: string; name: string; avatar?: string; provider: 'google' | 'github'; workspaceKey: string };
			};
			if (!data.authenticated || !data.user) {
				this.syncStatus = 'mock';
				return;
			}
			this.session = data.user;
			this.applySessionIdentity();
			await this.pullRemote();
		} catch (error) {
			this.syncStatus = 'mock';
			this.syncError = error instanceof Error ? error.message : 'Live sync unavailable';
		} finally {
			this.authResolved = true;
		}
	}

	private applySessionIdentity() {
		if (!this.session) return;
		const initials =
			this.session.name
				.split(' ')
				.filter(Boolean)
				.map((part) => part[0])
				.join('')
				.slice(0, 2)
				.toUpperCase() || 'SC';
		this.state.user = {
			id: `user-${this.session.email.split('@')[0]}`,
			name: this.session.name,
			email: this.session.email,
			role: 'owner',
			initials,
			avatarHue: 38
		};
	}

	private async pullRemote() {
		if (!browser || !this.session) return;
		this.syncStatus = 'connecting';
		try {
			const res = await fetch('/api/state', { credentials: 'same-origin' });
			const data = (await res.json()) as {
				mode: 'mock' | 'empty' | 'live' | 'offline';
				state?: AppState | null;
				workspaceKey?: string;
				updatedAt?: string;
				source?: 'seed' | 'live' | 'imported';
				error?: string;
			};
			if (data.mode === 'live' && data.state) {
				this.suppressSync = true;
				this.state = {
					...data.state,
					user: this.state.user,
					syncKey: data.workspaceKey,
					source: 'live',
					updatedAt: data.updatedAt ?? data.state.updatedAt
				};
				this.suppressSync = false;
				this.saveLocal();
				this.syncStatus = 'live';
				this.syncError = '';
				this.addActivity({
					kind: 'edit',
					title: 'Live workspace synchronized',
					detail: `Convex state ${data.workspaceKey ?? ''} loaded · ${this.state.books.length} books`
				});
				this.saveLocal();
				return;
			}
			if (data.mode === 'empty' && data.workspaceKey) {
				this.state.syncKey = data.workspaceKey;
				this.state.source = 'seed';
				this.state.updatedAt = new Date().toISOString();
				await this.pushRemote('seed');
				return;
			}
			this.syncStatus = data.mode === 'offline' ? 'offline' : 'mock';
			this.syncError = data.error ?? '';
		} catch (error) {
			this.syncStatus = 'offline';
			this.syncError = error instanceof Error ? error.message : 'Live sync unavailable';
		}
	}

	private async pushRemote(source: 'seed' | 'live' | 'imported' = 'live') {
		if (!browser || !this.session) return;
		this.syncStatus = 'saving';
		try {
			const res = await fetch('/api/state', {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ state: this.state, source: this.session ? source : 'seed' })
			});
			const data = (await res.json()) as { ok?: boolean; error?: string; fallback?: boolean };
			if (!res.ok || data.fallback || !data.ok) {
				this.syncStatus = 'offline';
				this.syncError = data.error ?? 'Live save failed';
				return;
			}
			this.state.source = source;
			this.state.syncKey = this.session.workspaceKey;
			this.state.updatedAt = new Date().toISOString();
			this.syncStatus = 'live';
			this.syncError = '';
		} catch (error) {
			this.syncStatus = 'offline';
			this.syncError = error instanceof Error ? error.message : 'Live save failed';
		}
	}

	private queueRemoteSync() {
		if (!browser || !this.session || this.suppressSync) return;
		if (this.syncTimer) clearTimeout(this.syncTimer);
		this.syncTimer = setTimeout(() => {
			this.syncTimer = null;
			void this.pushRemote('live');
		}, 1100);
	}

	private saveLocal() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(this.state));
		} catch {
			/* storage full or blocked */
		}
	}

	persist() {
		this.saveLocal();
		this.queueRemoteSync();
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
		if (browser) {
			void fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
		}
		this.session = null;
		this.syncStatus = 'mock';
		this.state.user = null;
		this.state.syncKey = undefined;
		this.state.source = 'mock';
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
