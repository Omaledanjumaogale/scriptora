import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const bookStatus = v.union(v.literal('active'), v.literal('paused'), v.literal('published'), v.literal('archived'));
const bookStage = v.union(
	v.literal('concept'),
	v.literal('blueprint'),
	v.literal('outline'),
	v.literal('drafting'),
	v.literal('editing'),
	v.literal('design'),
	v.literal('export'),
	v.literal('published')
);

export const list = query({
	args: { workspaceId: v.id('workspaces') },
	handler: async (ctx, { workspaceId }) => {
		const books = await ctx.db
			.query('books')
			.withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
			.collect();
		return books.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}
});

export const get = query({
	args: { id: v.id('books') },
	handler: async (ctx, { id }) => {
		const book = await ctx.db.get(id);
		if (!book) return null;
		const chapters = await ctx.db
			.query('chapters')
			.withIndex('by_book', (q) => q.eq('bookId', id))
			.collect();
		return { ...book, chapters: chapters.sort((a, b) => a.number - b.number) };
	}
});

export const create = mutation({
	args: {
		workspaceId: v.id('workspaces'),
		title: v.string(),
		author: v.string(),
		genre: v.string(),
		audience: v.string(),
		description: v.string(),
		targetWords: v.number(),
		trimSize: v.string(),
		bible: v.optional(v.any()),
		research: v.optional(v.any()),
		craft: v.optional(v.any()),
		cover: v.optional(v.any()),
		config: v.optional(v.any())
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();
		return await ctx.db.insert('books', {
			workspaceId: args.workspaceId,
			title: args.title,
			subtitle: '',
			author: args.author,
			genre: args.genre,
			audience: args.audience,
			language: 'English',
			description: args.description,
			logline: '',
			premise: '',
			themes: [],
			hooks: [],
			usps: [],
			keywords: [],
			status: 'active',
			stage: 'concept',
			targetWords: args.targetWords,
			wordCount: 0,
			quality: 70,
			progress: 6,
			series: '',
			volume: 1,
			isbn: '',
			trimSize: args.trimSize,
			cover: args.cover ?? {},
			bible: args.bible ?? {},
			research: args.research ?? {},
			craft: args.craft ?? {},
			config: args.config ?? {},
			createdAt: now,
			updatedAt: now
		});
	}
});

export const updateMeta = mutation({
	args: {
		id: v.id('books'),
		title: v.optional(v.string()),
		subtitle: v.optional(v.string()),
		description: v.optional(v.string()),
		logline: v.optional(v.string()),
		genre: v.optional(v.string()),
		audience: v.optional(v.string()),
		status: v.optional(bookStatus),
		stage: v.optional(bookStage),
		targetWords: v.optional(v.number()),
		trimSize: v.optional(v.string()),
		isbn: v.optional(v.string()),
		cover: v.optional(v.any()),
		bible: v.optional(v.any()),
		research: v.optional(v.any()),
		craft: v.optional(v.any()),
		config: v.optional(v.any())
	},
	handler: async (ctx, { id, ...patch }) => {
		const existing = await ctx.db.get(id);
		if (!existing) throw new Error('Book not found');
		const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
		await ctx.db.patch(id, { ...clean, updatedAt: new Date().toISOString() });
		return id;
	}
});

export const saveChapter = mutation({
	args: {
		chapterId: v.id('chapters'),
		content: v.string(),
		wordCount: v.number(),
		status: v.optional(
			v.union(v.literal('planned'), v.literal('drafting'), v.literal('drafted'), v.literal('edited'), v.literal('approved'))
		)
	},
	handler: async (ctx, { chapterId, content, wordCount, status }) => {
		const chapter = await ctx.db.get(chapterId);
		if (!chapter) throw new Error('Chapter not found');
		await ctx.db.patch(chapterId, {
			content,
			wordCount,
			status: status ?? (wordCount > 0 ? 'drafted' : chapter.status),
			updatedAt: new Date().toISOString()
		});
		return chapterId;
	}
});

export const approveChapter = mutation({
	args: { chapterId: v.id('chapters') },
	handler: async (ctx, { chapterId }) => {
		const chapter = await ctx.db.get(chapterId);
		if (!chapter) throw new Error('Chapter not found');
		await ctx.db.patch(chapterId, { status: 'approved', updatedAt: new Date().toISOString() });
		return chapterId;
	}
});

export const createChapter = mutation({
	args: {
		bookId: v.id('books'),
		workspaceId: v.id('workspaces'),
		number: v.number(),
		title: v.string(),
		part: v.string(),
		pov: v.string(),
		summary: v.string(),
		purpose: v.string(),
		targetWords: v.number(),
		scenes: v.array(v.any())
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('chapters', {
			...args,
			status: 'planned',
			wordCount: 0,
			content: '',
			updatedAt: new Date().toISOString()
		});
	}
});
