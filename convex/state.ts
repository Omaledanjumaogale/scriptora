import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

const SCHEMA_VERSION = 1;

export const get = internalQuery({
	args: { workspaceKey: v.string() },
	handler: async (ctx, { workspaceKey }) => {
		return await ctx.db
			.query('studioStates')
			.withIndex('by_workspace', (q) => q.eq('workspaceKey', workspaceKey))
			.first();
	}
});

export const upsert = internalMutation({
	args: {
		workspaceKey: v.string(),
		userEmail: v.string(),
		state: v.any(),
		source: v.optional(v.union(v.literal('seed'), v.literal('live'), v.literal('imported')))
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();
		const existing = await ctx.db
			.query('studioStates')
			.withIndex('by_workspace', (q) => q.eq('workspaceKey', args.workspaceKey))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, {
				userEmail: args.userEmail,
				state: args.state,
				source: args.source ?? 'live',
				schemaVersion: SCHEMA_VERSION,
				updatedAt: now
			});
			return existing._id;
		}
		return await ctx.db.insert('studioStates', {
			workspaceKey: args.workspaceKey,
			userEmail: args.userEmail,
			state: args.state,
			source: args.source ?? 'live',
			schemaVersion: SCHEMA_VERSION,
			createdAt: now,
			updatedAt: now
		});
	}
});

export const remove = internalMutation({
	args: { workspaceKey: v.string() },
	handler: async (ctx, { workspaceKey }) => {
		const existing = await ctx.db
			.query('studioStates')
			.withIndex('by_workspace', (q) => q.eq('workspaceKey', workspaceKey))
			.first();
		if (existing) await ctx.db.delete(existing._id);
		return Boolean(existing);
	}
});

export const list = internalQuery({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const rows = await ctx.db.query('studioStates').collect();
		return rows
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			.slice(0, Math.max(1, Math.min(limit ?? 100, 300)));
	}
});

export const overview = internalQuery({
	args: {},
	handler: async (ctx) => {
		const states = await ctx.db.query('studioStates').collect();
		const books = states.flatMap((s) => {
			const value = s.state as { books?: Array<Record<string, unknown>>; workspace?: Record<string, unknown>; user?: Record<string, unknown> | null };
			return (value.books ?? []).map((b) => ({
				id: String(b.id ?? ''),
				title: String(b.title ?? 'Untitled'),
				author: String(b.author ?? ''),
				stage: String(b.stage ?? ''),
				status: String(b.status ?? ''),
				wordCount: Number(b.wordCount ?? 0),
				targetWords: Number(b.targetWords ?? 0),
				quality: Number(b.quality ?? 0),
				progress: Number(b.progress ?? 0),
				workspaceKey: s.workspaceKey
			}));
		});
		const runs = states.flatMap((s) => {
			const value = s.state as { runs?: Array<Record<string, unknown>> };
			return value.runs ?? [];
		});
		const members = states.map((s) => {
			const value = s.state as { user?: { name?: string; email?: string } | null; workspace?: { name?: string } };
			return {
				workspaceKey: s.workspaceKey,
				email: value.user?.email ?? s.userEmail,
				name: value.user?.name ?? s.userEmail,
				workspace: value.workspace?.name ?? s.workspaceKey,
				updatedAt: s.updatedAt,
				books: ((s.state as { books?: unknown[] }).books ?? []).length
			};
		});
		return {
			workspaces: states.length,
			books: books.length,
			words: books.reduce((sum, b) => sum + b.wordCount, 0),
			runs: runs.length,
			liveRuns: runs.filter((r) => r.status === 'running' || r.status === 'queued').length,
			revenue: states.reduce((sum, s) => {
				const ws = (s.state as { workspace?: { plan?: string; status?: string } }).workspace;
				return sum + (ws?.plan === 'enterprise' && ws?.status === 'active' ? 5000 : 0);
			}, 0),
			booksList: books.sort((a, b) => b.wordCount - a.wordCount).slice(0, 100),
			members: members.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
			recent: states.slice(0, 20).map((s) => ({
				workspaceKey: s.workspaceKey,
				userEmail: s.userEmail,
				updatedAt: s.updatedAt,
				source: s.source
			}))
		};
	}
});
