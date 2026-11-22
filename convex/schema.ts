import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Production schema for Scriptora.
 *
 * The demo ships with a localStorage adapter so the entire studio runs without
 * provisioning. Point PUBLIC_CONVEX_URL at a deployment and these tables become
 * the source of truth; the shapes mirror `src/lib/types.ts`.
 */
export default defineSchema({
	users: defineTable({
		name: v.string(),
		email: v.string(),
		avatar: v.optional(v.string()),
		role: v.union(v.literal('owner'), v.literal('editor'), v.literal('writer'), v.literal('designer'), v.literal('viewer')),
		workspaceId: v.id('workspaces'),
		createdAt: v.string()
	})
		.index('by_email', ['email'])
		.index('by_workspace', ['workspaceId']),

	workspaces: defineTable({
		name: v.string(),
		initials: v.string(),
		plan: v.union(v.literal('trial'), v.literal('studio'), v.literal('enterprise')),
		status: v.union(v.literal('trialing'), v.literal('active'), v.literal('past_due'), v.literal('canceled')),
		seats: v.number(),
		seatsUsed: v.number(),
		aiCreditsUsed: v.number(),
		aiCreditsTotal: v.number(),
		booksThisMonth: v.number(),
		wordsThisMonth: v.number(),
		renewal: v.string(),
		ownerId: v.optional(v.id('users')),
		createdAt: v.string()
	}),

	books: defineTable({
		workspaceId: v.id('workspaces'),
		title: v.string(),
		subtitle: v.string(),
		author: v.string(),
		genre: v.string(),
		audience: v.string(),
		language: v.string(),
		description: v.string(),
		logline: v.string(),
		premise: v.string(),
		themes: v.array(v.string()),
		hooks: v.array(v.string()),
		usps: v.array(v.string()),
		keywords: v.array(v.string()),
		status: v.union(v.literal('active'), v.literal('paused'), v.literal('published'), v.literal('archived')),
		stage: v.union(
			v.literal('concept'),
			v.literal('blueprint'),
			v.literal('outline'),
			v.literal('drafting'),
			v.literal('editing'),
			v.literal('design'),
			v.literal('export'),
			v.literal('published')
		),
		targetWords: v.number(),
		wordCount: v.number(),
		quality: v.number(),
		progress: v.number(),
		series: v.string(),
		volume: v.number(),
		isbn: v.string(),
		trimSize: v.string(),
		cover: v.any(),
		bible: v.any(),
		research: v.any(),
		craft: v.any(),
		config: v.any(),
		createdAt: v.string(),
		updatedAt: v.string(),
		publishedAt: v.optional(v.string())
	})
		.index('by_workspace', ['workspaceId'])
		.index('by_workspace_stage', ['workspaceId', 'stage'])
		.searchIndex('search_title', { searchField: 'title', filterFields: ['workspaceId', 'status'] }),

	chapters: defineTable({
		bookId: v.id('books'),
		workspaceId: v.id('workspaces'),
		number: v.number(),
		title: v.string(),
		part: v.string(),
		pov: v.string(),
		summary: v.string(),
		purpose: v.string(),
		status: v.union(
			v.literal('planned'),
			v.literal('drafting'),
			v.literal('drafted'),
			v.literal('edited'),
			v.literal('approved')
		),
		wordCount: v.number(),
		targetWords: v.number(),
		content: v.string(),
		scenes: v.array(v.any()),
		updatedAt: v.string()
	})
		.index('by_book', ['bookId'])
		.index('by_book_number', ['bookId', 'number']),

	agentRuns: defineTable({
		workspaceId: v.id('workspaces'),
		bookId: v.id('books'),
		bookTitle: v.string(),
		pipeline: v.string(),
		status: v.union(
			v.literal('queued'),
			v.literal('running'),
			v.literal('paused'),
			v.literal('complete'),
			v.literal('failed'),
			v.literal('canceled')
		),
		progress: v.number(),
		model: v.string(),
		cost: v.number(),
		tokens: v.number(),
		steps: v.array(v.any()),
		logs: v.array(v.any()),
		startedAt: v.string(),
		finishedAt: v.optional(v.string())
	})
		.index('by_workspace', ['workspaceId'])
		.index('by_book', ['bookId'])
		.index('by_status', ['workspaceId', 'status']),

	activities: defineTable({
		workspaceId: v.id('workspaces'),
		bookId: v.optional(v.id('books')),
		kind: v.union(v.literal('agent'), v.literal('edit'), v.literal('approval'), v.literal('billing'), v.literal('system')),
		title: v.string(),
		detail: v.string(),
		actor: v.string(),
		createdAt: v.string()
	})
		.index('by_workspace', ['workspaceId'])
		.index('by_book', ['bookId']),

	/**
	 * Live sync document for the scriptable studio. The demo can run entirely
	 * client-side; this table holds the authoritative workspace snapshot once a
	 * signed-in member or the super admin saves it.
	 */
	studioStates: defineTable({
		workspaceKey: v.string(),
		userEmail: v.string(),
		state: v.any(),
		schemaVersion: v.number(),
		source: v.union(v.literal('seed'), v.literal('live'), v.literal('imported')),
		createdAt: v.string(),
		updatedAt: v.string()
	})
		.index('by_workspace', ['workspaceKey'])
		.index('by_user', ['userEmail']),

	invites: defineTable({
		workspaceId: v.id('workspaces'),
		email: v.string(),
		role: v.union(v.literal('owner'), v.literal('editor'), v.literal('writer'), v.literal('designer'), v.literal('viewer')),
		status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('revoked')),
		invitedBy: v.id('users'),
		createdAt: v.string()
	})
		.index('by_workspace', ['workspaceId'])
		.index('by_email', ['email'])
});
