import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const get = query({
	args: { id: v.id('workspaces') },
	handler: async (ctx, { id }) => await ctx.db.get(id)
});

export const byName = query({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const all = await ctx.db.query('workspaces').collect();
		return all.find((w) => w.name.toLowerCase() === name.toLowerCase()) ?? null;
	}
});

/**
 * Idempotent bootstrap for a fresh deployment. Creates the enterprise
 * workspace the demo signs into, then returns its id.
 */
export const bootstrap = mutation({
	args: {
		name: v.string(),
		initials: v.string(),
		ownerName: v.string(),
		ownerEmail: v.string()
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query('workspaces').collect();
		const match = existing.find((w) => w.name.toLowerCase() === args.name.toLowerCase());
		if (match) return match._id;

		const now = new Date().toISOString();
		const workspaceId = await ctx.db.insert('workspaces', {
			name: args.name,
			initials: args.initials,
			plan: 'enterprise',
			status: 'active',
			seats: 10,
			seatsUsed: 1,
			aiCreditsUsed: 0,
			aiCreditsTotal: 100,
			booksThisMonth: 0,
			wordsThisMonth: 0,
			renewal: new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
			createdAt: now
		});

		const ownerId = await ctx.db.insert('users', {
			name: args.ownerName,
			email: args.ownerEmail,
			role: 'owner',
			workspaceId,
			createdAt: now
		});

		await ctx.db.patch(workspaceId, { ownerId });
		return workspaceId;
	}
});

export const listActivities = query({
	args: { workspaceId: v.id('workspaces'), limit: v.optional(v.number()) },
	handler: async (ctx, { workspaceId, limit }) => {
		const items = await ctx.db
			.query('activities')
			.withIndex('by_workspace', (q) => q.eq('workspaceId', workspaceId))
			.collect();
		return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit ?? 30);
	}
});

export const logActivity = mutation({
	args: {
		workspaceId: v.id('workspaces'),
		bookId: v.optional(v.id('books')),
		kind: v.union(v.literal('agent'), v.literal('edit'), v.literal('approval'), v.literal('billing'), v.literal('system')),
		title: v.string(),
		detail: v.string(),
		actor: v.string()
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert('activities', { ...args, createdAt: new Date().toISOString() });
	}
});

export const invite = mutation({
	args: {
		workspaceId: v.id('workspaces'),
		email: v.string(),
		role: v.union(v.literal('owner'), v.literal('editor'), v.literal('writer'), v.literal('designer'), v.literal('viewer')),
		invitedBy: v.id('users')
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('invites')
			.withIndex('by_email', (q) => q.eq('email', args.email))
			.first();
		if (existing && existing.status === 'pending') return existing._id;
		return await ctx.db.insert('invites', {
			...args,
			status: 'pending',
			createdAt: new Date().toISOString()
		});
	}
});
