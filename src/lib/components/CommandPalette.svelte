<script lang="ts">
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import Icon from './Icon.svelte';
import { fade, scale } from 'svelte/transition';

let q = $state('');

const actions = [
	{ label: 'New book', hint: 'Create', icon: 'plus', href: '/app/library?new=1' },
	{ label: 'Open Agent Studio', hint: 'Run a pipeline', icon: 'studio', href: '/app/studio' },
	{ label: 'Specialist roster', hint: 'Agents', icon: 'agents', href: '/app/agents' },
	{ label: 'Market intelligence', hint: 'Research', icon: 'target', href: '/app/library' },
	{ label: 'Plan & billing', hint: '$5,000 Enterprise', icon: 'billing', href: '/app/billing' },
	{ label: 'Workspace settings', hint: 'Providers, team', icon: 'settings', href: '/app/settings' }
];

const bookResults = $derived(
	studio.books
		.filter((b) => !q || (b.title + b.author + b.genre).toLowerCase().includes(q.toLowerCase()))
		.slice(0, 5)
);
const actionResults = $derived(
	actions.filter((a) => !q || (a.label + a.hint).toLowerCase().includes(q.toLowerCase()))
);

function select(href: string) {
	studio.commandOpen = false;
	q = '';
	goto(href);
}

function onKey(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
		e.preventDefault();
		studio.commandOpen = !studio.commandOpen;
	}
	if (e.key === 'Escape') studio.commandOpen = false;
}
</script>

<svelte:window onkeydown={onKey} />

{#if studio.commandOpen}
	<div class="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" transition:fade={{ duration: 120 }}>
		<button class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick={() => (studio.commandOpen = false)} aria-label="Close search"></button>
		<div class="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-line-strong bg-panel-2 shadow-[0_40px_140px_-20px_rgba(0,0,0,.95)]" transition:scale={{ duration: 150, start: 0.98 }}>
			<div class="flex items-center gap-2.5 border-b border-line px-4">
				<Icon name="search" size={16} class="text-faint" />
				<input
					class="h-12 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
					placeholder="Search books, specialists, actions…"
					bind:value={q}
					autofocus
				/>
				<kbd class="mono rounded border border-line px-1.5 py-0.5 text-[9px] text-faint">ESC</kbd>
			</div>
			<div class="max-h-[60vh] overflow-y-auto p-2">
				{#if bookResults.length}
					<p class="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">Books</p>
					{#each bookResults as book}
						<button class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.05]" onclick={() => select(`/app/books/${book.id}`)}>
							<span class="flex h-8 w-6 shrink-0 items-center justify-center rounded-[2px] bg-gradient-to-br from-panel-3 to-canvas text-[7px] text-gold">◈</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-[12.5px] text-ink">{book.title}</span>
								<span class="block truncate text-[10px] text-faint">{book.genre} · {book.stage}</span>
							</span>
							<Icon name="arrow-up-right" size={13} class="text-faint" />
						</button>
					{/each}
				{/if}
				{#if actionResults.length}
					<p class="px-2 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">Actions</p>
					{#each actionResults as a}
						<button class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.05]" onclick={() => select(a.href)}>
							<span class="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white/[0.03] text-muted"><Icon name={a.icon} size={14} /></span>
							<span class="flex-1 text-[12.5px] text-ink">{a.label}</span>
							<span class="text-[10px] text-faint">{a.hint}</span>
						</button>
					{/each}
				{/if}
				{#if !bookResults.length && !actionResults.length}
					<p class="px-3 py-8 text-center text-[12px] text-faint">No matches. Try a book title or an action.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
