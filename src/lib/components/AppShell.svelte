<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import { PLAN_PRICE } from '$lib/seed';
import Icon from './Icon.svelte';
import Avatar from './Avatar.svelte';
import type { Snippet } from 'svelte';

interface Props {
	children: Snippet;
}
let { children }: Props = $props();

const nav = [
	{ href: '/app', label: 'Overview', icon: 'home', exact: true },
	{ href: '/app/library', label: 'Library', icon: 'library' },
	{ href: '/app/studio', label: 'Agent Studio', icon: 'studio' },
	{ href: '/app/agents', label: 'Specialists', icon: 'agents' },
	{ href: '/app/analytics', label: 'Analytics', icon: 'chart' }
];

const secondary = [
	{ href: '/app/billing', label: 'Plan & billing', icon: 'billing' },
	{ href: '/app/settings', label: 'Settings', icon: 'settings' }
];

let notificationsOpen = $state(false);
let workspaceOpen = $state(false);

const isActive = (href: string, exact?: boolean) =>
	exact ? page.url.pathname === href : page.url.pathname.startsWith(href);

function go(href: string) {
	studio.sidebarOpen = false;
	notificationsOpen = false;
	workspaceOpen = false;
	goto(href);
}

const unread = $derived(studio.activity.filter((a) => a.kind === 'agent').length);
const syncLabel = $derived(
	studio.syncStatus === 'live'
		? 'Live'
		: studio.syncStatus === 'saving'
			? 'Syncing'
			: studio.syncStatus === 'offline'
				? 'Offline'
				: studio.syncStatus === 'connecting'
					? 'Connecting'
					: 'Demo'
);
const syncTone = $derived(
	studio.syncStatus === 'live'
		? 'text-teal'
		: studio.syncStatus === 'saving' || studio.syncStatus === 'connecting'
			? 'text-gold'
			: studio.syncStatus === 'offline'
				? 'text-red-300'
				: 'text-faint'
);
</script>

<div class="min-h-screen bg-canvas text-ink">
	<!-- ambient background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div class="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-gold/[0.045] blur-[100px]"></div>
		<div class="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-teal/[0.03] blur-[120px]"></div>
	</div>

	<!-- mobile overlay -->
	{#if studio.sidebarOpen}
		<button
			class="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
			onclick={() => (studio.sidebarOpen = false)}
			aria-label="Close navigation"
		></button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col border-r border-line bg-canvas-2/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0"
		class:-translate-x-full={!studio.sidebarOpen}
	>
		<div class="flex h-[64px] items-center gap-2.5 px-5">
			<a href="/app" class="flex items-center gap-2.5" aria-label="Scriptora home">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607] shadow-[0_1px_0_rgba(255,255,255,.35)_inset]">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z" />
						<path d="M9 8h6M9 12h6M9 16h3" />
					</svg>
				</span>
				<span class="font-display text-[19px] tracking-tight text-ink">Scriptora</span>
			</a>
			<span class="chip chip-gold ml-auto !px-1.5 !py-0.5 !text-[9px]">ENT</span>
			<button class="btn btn-ghost ml-1 p-1.5 lg:hidden" onclick={() => (studio.sidebarOpen = false)} aria-label="Close">
				<Icon name="x" size={16} />
			</button>
		</div>

		<!-- workspace -->
		<div class="relative mx-3 mb-4">
			<button
				class="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white/[0.025] px-2.5 py-2 text-left transition hover:border-line-strong"
				onclick={() => (workspaceOpen = !workspaceOpen)}
			>
				<span class="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#2a3446] to-[#1a2230] text-[10px] font-semibold text-gold">VC</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-[12px] font-medium text-ink">{studio.state.workspace.name}</span>
					<span class="block truncate text-[10px] text-faint">Enterprise · {studio.state.workspace.seats} seats</span>
				</span>
				<Icon name="chevron-down" size={13} class="text-faint" />
			</button>
			{#if workspaceOpen}
				<div class="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line-strong bg-panel-2 py-1 shadow-xl">
					<button class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-ink hover:bg-white/5" onclick={() => go('/app/settings')}>
						<Icon name="settings" size={14} /> Workspace settings
					</button>
					<button class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-ink hover:bg-white/5" onclick={() => go('/app/billing')}>
						<Icon name="billing" size={14} /> Plan & billing
					</button>
					<button class="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-muted hover:bg-white/5" onclick={() => go('/app/settings')}>
						<Icon name="users" size={14} /> Invite teammate
					</button>
				</div>
			{/if}
		</div>

		<div class="scrollbar-none flex-1 overflow-y-auto px-3 pb-4">
			<p class="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Workspace</p>
			<nav class="space-y-0.5">
				{#each nav as item}
					<button class="nav-link w-full {isActive(item.href, item.exact) ? 'active' : ''}" onclick={() => go(item.href)}>
						<Icon name={item.icon} size={16} />
						<span>{item.label}</span>
						{#if item.href === '/app/studio' && studio.liveRuns.length}
							<span class="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-teal/15 px-1 text-[9px] font-semibold text-teal">{studio.liveRuns.length}</span>
						{/if}
					</button>
				{/each}
			</nav>

			<div class="mx-2.5 my-4 divider"></div>

			<p class="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Recent books</p>
			<nav class="space-y-0.5">
				{#each studio.activeBooks.slice(0, 4) as book}
					<button class="nav-link w-full" onclick={() => go(`/app/books/${book.id}`)}>
						<span class="h-1.5 w-1.5 shrink-0 rounded-full" style="background:{book.cover.palette === 'parchment' || book.cover.palette === 'bone' ? '#b98f4a' : '#7dd3c0'}"></span>
						<span class="truncate">{book.title}</span>
					</button>
				{/each}
			</nav>

			<div class="mx-2.5 my-4 divider"></div>

			<nav class="space-y-0.5">
				{#each secondary as item}
					<button class="nav-link w-full {isActive(item.href) ? 'active' : ''}" onclick={() => go(item.href)}>
						<Icon name={item.icon} size={16} />
						<span>{item.label}</span>
					</button>
				{/each}
			</nav>
		</div>

		<!-- plan card -->
		<div class="mx-3 mb-3 rounded-xl border border-gold/15 bg-gradient-to-b from-gold/[0.07] to-transparent p-3">
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">Enterprise</span>
				<span class="text-[10px] text-faint">${(PLAN_PRICE / 1000).toFixed(0)}k/yr</span>
			</div>
			<p class="mt-1.5 text-[11px] leading-snug text-muted">Unlimited books · all specialists · full export suite.</p>
			<div class="mt-2.5 flex items-center justify-between text-[10px] text-faint">
				<span>AI credits</span>
				<span class="mono">{studio.state.workspace.aiCreditsUsed}/{studio.state.workspace.aiCreditsTotal}</span>
			</div>
			<div class="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
				<div class="h-full rounded-full bg-gold" style="width:{(studio.state.workspace.aiCreditsUsed / studio.state.workspace.aiCreditsTotal) * 100}%"></div>
			</div>
		</div>

		<!-- user -->
		<div class="border-t border-line p-3">
			<div class="flex items-center gap-2.5">
				<Avatar name={studio.user?.name} initials={studio.user?.initials} hue={studio.user?.avatarHue} size={32} />
				<div class="min-w-0 flex-1">
					<p class="truncate text-[12px] font-medium text-ink">{studio.user?.name}</p>
					<p class="truncate text-[10px] text-faint">{studio.user?.email}</p>
				</div>
				<button class="btn btn-ghost p-1.5" title="Sign out" onclick={() => { studio.logout(); goto('/'); }}>
					<Icon name="logout" size={15} />
				</button>
			</div>
		</div>
	</aside>

	<!-- main -->
	<div class="lg:pl-[254px]">
		<header class="sticky top-0 z-20 flex h-[64px] items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-6">
			<button class="btn btn-ghost p-2 lg:hidden" onclick={() => (studio.sidebarOpen = true)} aria-label="Open navigation">
				<Icon name="menu" size={18} />
			</button>

			<div class="hidden items-center gap-1.5 text-[12px] text-faint md:flex">
				<span>Workspace</span>
				<Icon name="chevron-right" size={12} />
				<span class="text-muted">{page.url.pathname === '/app' ? 'Overview' : page.url.pathname.split('/').filter(Boolean).slice(1).join(' / ').replace(/-/g, ' ')}</span>
			</div>

			<button
				class="ml-auto hidden items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.08em] transition hover:border-line-strong sm:flex"
				title={studio.syncError || (studio.session ? `Signed in as ${studio.session.email}` : 'Local demo data')}
				onclick={() => go('/app/settings#integrations')}
			>
				<span class="h-1.5 w-1.5 rounded-full {studio.syncStatus === 'live' ? 'bg-teal' : studio.syncStatus === 'offline' ? 'bg-red-400' : 'bg-gold'}"></span>
				<span class={syncTone}>{syncLabel}</span>
			</button>

			<button
				class="flex h-9 w-full max-w-[300px] items-center gap-2 rounded-lg border border-line bg-white/[0.025] px-3 text-[12px] text-faint transition hover:border-line-strong sm:ml-2"
				onclick={() => (studio.commandOpen = true)}
			>
				<Icon name="search" size={14} />
				<span>Search books, agents, actions…</span>
				<span class="mono ml-auto rounded border border-line px-1.5 py-0.5 text-[9px]">⌘K</span>
			</button>

			<button class="btn btn-primary hidden h-9 sm:inline-flex" onclick={() => go('/app/library?new=1')}>
				<Icon name="plus" size={15} /> New book
			</button>

			<div class="relative">
				<button
					class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:text-ink"
					onclick={() => (notificationsOpen = !notificationsOpen)}
					aria-label="Notifications"
				>
					<Icon name="bell" size={16} />
					{#if unread}<span class="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold"></span>{/if}
				</button>
				{#if notificationsOpen}
					<div class="absolute right-0 top-full z-30 mt-2 w-[320px] overflow-hidden rounded-xl border border-line-strong bg-panel-2 shadow-2xl">
						<div class="flex items-center justify-between border-b border-line px-4 py-3">
							<span class="text-[12px] font-semibold">Activity</span>
							<button class="text-[11px] text-gold hover:underline" onclick={() => go('/app/studio')}>Open studio</button>
						</div>
						<div class="max-h-[300px] overflow-y-auto">
							{#each studio.activity.slice(0, 4) as item}
								<button class="flex w-full gap-2.5 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-white/[0.025]" onclick={() => go(item.bookId ? `/app/books/${item.bookId}` : '/app/studio')}>
									<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70"></span>
									<span class="min-w-0">
										<span class="block truncate text-[12px] text-ink">{item.title}</span>
										<span class="mt-0.5 block truncate text-[10px] text-faint">{item.detail}</span>
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<button onclick={() => go('/app/settings')} class="shrink-0" aria-label="Account">
				<Avatar name={studio.user?.name} initials={studio.user?.initials} hue={studio.user?.avatarHue} size={30} />
			</button>
		</header>

		<main class="relative mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
			{@render children()}
		</main>
	</div>
</div>
