export type Role = 'owner' | 'editor' | 'author' | 'viewer';

export interface User {
	id: string;
	name: string;
	email: string;
	role: Role;
	initials: string;
	avatarHue: number;
}

export type BookStage =
	| 'concept'
	| 'blueprint'
	| 'outline'
	| 'drafting'
	| 'editing'
	| 'design'
	| 'export'
	| 'published';

export type BookStatus = 'draft' | 'active' | 'review' | 'complete' | 'archived';

export interface Scene {
	id: string;
	title: string;
	summary: string;
	purpose: string;
	status: 'planned' | 'drafted' | 'revised';
	/** Harmon story-circle audit */
	circuit?: {
		you: boolean;
		need: boolean;
		go: boolean;
		search: boolean;
		find: boolean;
		take: boolean;
		return: boolean;
		change: boolean;
	};
}

export interface Chapter {
	id: string;
	number: number;
	part: string;
	title: string;
	summary: string;
	purpose: string;
	pov: string;
	status: 'planned' | 'drafting' | 'drafted' | 'edited' | 'approved';
	wordCount: number;
	targetWords: number;
	content: string;
	scenes: Scene[];
	notes?: string;
	updatedAt: string;
}

export interface Character {
	id: string;
	name: string;
	role: 'protagonist' | 'antagonist' | 'ally' | 'mentor' | 'minor';
	age?: string;
	occupation: string;
	want: string;
	need: string;
	wound: string;
	arc: string;
	voice: string;
	tier: 1 | 2 | 3;
	color: string;
}

export interface WorldEntry {
	id: string;
	category: 'Place' | 'Faction' | 'Technology' | 'Magic' | 'Culture' | 'Timeline';
	name: string;
	description: string;
	rules: string;
}

export interface CanonRule {
	id: string;
	rule: string;
	scope: string;
	status: 'locked' | 'flexible';
}

export interface StoryBible {
	characters: Character[];
	world: WorldEntry[];
	canon: CanonRule[];
	glossary: { term: string; definition: string }[];
	timeline: { when: string; event: string }[];
	styleGuide: {
		pov: string;
		tense: string;
		distance: string;
		dialogue: string;
		avoid: string;
	};
}

export interface ResearchKeyword {
	keyword: string;
	volume: number;
	difficulty: number;
	intent: 'commercial' | 'informational' | 'long-tail';
	opportunity: number;
}

export interface ComparableTitle {
	title: string;
	author: string;
	price: number;
	rating: number;
	reviews: number;
	rank: number;
	angle: string;
}

export interface MarketResearch {
	demandScore: number;
	competitionScore: number;
	priceMin: number;
	priceMax: number;
	suggestedPrice: number;
	keywords: ResearchKeyword[];
	comps: ComparableTitle[];
	audienceInsight: string;
	positioning: string;
	costEstimate: { label: string; value: number }[];
	channels: { name: string; fit: number; note: string }[];
	updatedAt: string;
}

export interface CoverDesign {
	palette: 'midnight' | 'parchment' | 'forest' | 'oxide' | 'violet' | 'bone';
	motif: 'rings' | 'arch' | 'waves' | 'grid' | 'botanical' | 'constellation';
	typography: 'editorial' | 'modern' | 'classic' | 'brutalist';
	tagline: string;
	backCopy: string;
	spineText: string;
	imprint: string;
	updatedAt: string;
}

export interface CraftReport {
	aiismScore: number;
	readability: number;
	pacing: { chapter: string; tension: number; note: string }[];
	sceneCircuits: { chapter: string; complete: number; total: number }[];
	continuity: { severity: 'high' | 'medium' | 'low'; message: string; where: string }[];
	protocols: { id: string; name: string; enabled: boolean; note: string }[];
	genreRouting: { protocol: string; applies: 'core' | 'adapt' | 'optional' | 'skip' }[];
	updatedAt: string;
}

export interface GenerationConfig {
	provider: string;
	model: string;
	styleAnchor: string;
	temperature: number;
	autonomy: 'copilot' | 'supervised' | 'autonomous';
	budgetCap: number;
	protocols: string[];
}

export interface Book {
	id: string;
	title: string;
	subtitle: string;
	author: string;
	genre: string;
	audience: string;
	language: string;
	description: string;
	logline: string;
	premise: string;
	themes: string[];
	hooks: string[];
	usps: string[];
	keywords: string[];
	status: BookStatus;
	stage: BookStage;
	targetWords: number;
	wordCount: number;
	quality: number;
	progress: number;
	series: string;
	volume: number;
	isbn: string;
	trimSize: string;
	createdAt: string;
	updatedAt: string;
	cover: CoverDesign;
	bible: StoryBible;
	research: MarketResearch;
	craft: CraftReport;
	chapters: Chapter[];
	config: GenerationConfig;
	publishedAt?: string;
}

export interface AgentRun {
	id: string;
	bookId: string;
	bookTitle: string;
	pipeline: string;
	status: 'queued' | 'running' | 'paused' | 'complete' | 'failed';
	progress: number;
	startedAt: string;
	finishedAt?: string;
	cost: number;
	tokens: number;
	model: string;
	steps: { name: string; status: 'pending' | 'running' | 'done' | 'failed'; detail?: string }[];
	logs: { t: string; level: 'info' | 'ok' | 'warn' | 'error'; message: string }[];
}

export interface Activity {
	id: string;
	kind: 'draft' | 'edit' | 'agent' | 'design' | 'export' | 'billing' | 'member';
	title: string;
	detail: string;
	at: string;
	bookId?: string;
}

export interface Invoice {
	id: string;
	number: string;
	date: string;
	amount: number;
	status: 'paid' | 'due' | 'void';
	description: string;
}

export interface Workspace {
	id: string;
	name: string;
	plan: 'enterprise';
	seats: number;
	seatsUsed: number;
	price: number;
	currency: string;
	interval: 'year';
	renewal: string;
	status: 'active' | 'trialing' | 'past_due';
	booksThisMonth: number;
	wordsThisMonth: number;
	aiCreditsUsed: number;
	aiCreditsTotal: number;
	invoices: Invoice[];
	providers: { id: string; name: string; connected: boolean; models: string[]; lastUsed?: string }[];
}

export interface AppState {
	user: User | null;
	workspace: Workspace;
	books: Book[];
	runs: AgentRun[];
	activity: Activity[];
	onboarded: boolean;
	createdAt: string;
	updatedAt?: string;
	syncKey?: string;
	source?: 'seed' | 'mock' | 'live' | 'imported';
}

export interface ConceptInput {
	title: string;
	genre: string;
	audience: string;
	description: string;
	author: string;
	length: string;
	persona: string;
}
