import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const runStatus = v.union(
	v.literal('queued'),
	v.literal('running'),
	v.literal('paused'),
	v.literal('complete'),
	v.literal('failed'),
	v.literal('canceled')
);

export const listByBook = query({
	args: { bookId: v.id('books') },
	handler: async (ctx, { bookId }) => {
		const runs = await ctx.db
			.query('agentRuns')
			.withIndex('by_book', (q) => q.eq('bookId', bookId))
			.collect();
		return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
	}
});

export const listByWorkspace = query({
	args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
	handler: async (ctx, { workspaceId, limit }) => {
		const runs = await ctx.db
			.query('agentRuns')
			.withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
			.collect();
		return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit ?? 50);
	}
});

export const create = mutation({
	args: {
		workspaceId: v.id('workspaces'),
		bookId: v.id('books'),
		bookTitle: v.string(),
		pipeline: v.string(),
		model: v.string(),
		steps: v.array(v.any())
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('agentRuns', {
			...args,
			status: 'queued',
			progress: 0,
			cost: 0,
			tokens: 0,
			logs: [{ t: new Date().toISOString(), level: 'info', message: 'Run queued.' }],
			startedAt: new Date().toISOString()
		});
	}
});

export const update = mutation({
	args: {
		id: v.id('agentRuns'),
		status: v.optional(runStatus),
		progress: v.optional(v.number()),
		model: v.optional(v.string()),
		cost: v.optional(v.number()),
		tokens: v.optional(v.number()),
		steps: v.optional(v.array(v.any())),
		finishedAt: v.optional(v.string())
	},
	handler: async (ctx, { id, ...patch }) => {
		const existing = await ctx.db.get(id);
		if (!existing) throw new Error('Run not found');
		const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
		await ctx.db.patch(id, clean);
		return id;
	}
});

export const appendLog = mutation({
	args: {
		id: v.id('agentRuns'),
		level: v.union(v.literal('info'), v.literal('ok'), v.literal('warn'), v.literal('error')),
		message: v.string(),
		detail: v.optional(v.string())
	},
	handler: async (ctx, { id, level, message, detail }) => {
		const run = await ctx.db.get(id);
		if (!run) throw new Error('Run not found');
		await ctx.db.patch(id, {
			logs: [...run.logs, { t: new Date().toISOString(), level, message, detail }]
		});
		return id;
	}
});
