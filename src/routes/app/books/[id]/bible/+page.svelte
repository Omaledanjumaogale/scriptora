<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { startPipeline } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import Avatar from '$lib/components/Avatar.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
let tab = $state<'characters' | 'world' | 'canon' | 'timeline'>('characters');

function regenerate() {
	if (!book) return;
	studio.regenerateBible(book.id);
	studio.notify('Story bible regenerated with new canon locks');
}

const roleTone: Record<string, string> = {
	protagonist: 'chip-gold',
	antagonist: 'chip-rose',
	ally: 'chip-teal',
	mentor: 'chip-violet',
	minor: ''
};
</script>

	<svelte:head><title>Story Bible — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Story bible" title="The single source of truth." description={`${book.bible.characters.length} characters, ${book.bible.world.length} world entries and ${book.bible.canon.length} canon locks. The drafting and continuity agents read this before every chapter.`}>
		<button class="btn btn-secondary" onclick={regenerate}><Icon name="refresh" size={14} /> Regenerate bible</button>
		<button class="btn btn-secondary" onclick={() => startPipeline(book.id, 'editorial', { speed: 1.4 })}><Icon name="shield" size={14} /> Audit against canon</button>
	</PageHeader>

	<div class="mb-4 flex flex-wrap gap-1.5">
		{#each [['characters', 'Characters', 'users'], ['world', 'World', 'globe'], ['canon', 'Canon & glossary', 'lock'], ['timeline', 'Timeline', 'clock']] as [k, l, icon]}
			<button class="chip !px-3 !py-1.5 !text-[10.5px] {tab === k ? 'chip-gold' : ''}" onclick={() => (tab = k as typeof tab)}><Icon name={icon} size={12} /> {l}</button>
		{/each}
	</div>

	{#if tab === 'characters'}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each book.bible.characters as c}
				<div class="card p-4">
					<div class="flex items-start gap-3">
						<Avatar name={c.name} hue={38} size={38} />
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<h3 class="truncate font-display text-[16px] text-ink">{c.name}</h3>
								<span class="chip !px-1.5 !py-0 !text-[8px] capitalize {roleTone[c.role]}">{c.role}</span>
							</div>
							<p class="mt-0.5 text-[10px] text-faint">{c.occupation} · {c.age} · Tier {c.tier}</p>
						</div>
					</div>
					<div class="mt-3 space-y-2 text-[10.5px] leading-relaxed">
						<p><span class="text-[9px] uppercase tracking-[0.08em] text-faint">Want</span><br /><span class="text-muted">{c.want}</span></p>
						<p><span class="text-[9px] uppercase tracking-[0.08em] text-faint">Need</span><br /><span class="text-muted">{c.need}</span></p>
						<p><span class="text-[9px] uppercase tracking-[0.08em] text-faint">Wound</span><br /><span class="text-muted">{c.wound}</span></p>
						<p class="border-t border-line pt-2"><span class="text-[9px] uppercase tracking-[0.08em] text-faint">Arc</span><br /><span class="text-muted">{c.arc}</span></p>
					</div>
					<div class="mt-3 rounded-md border border-line bg-canvas/40 p-2">
						<p class="text-[9px] uppercase tracking-[0.08em] text-faint">Voice</p>
						<p class="mt-0.5 text-[10px] italic leading-relaxed text-muted">{c.voice}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else if tab === 'world'}
		<div class="grid gap-4 md:grid-cols-2">
			{#each book.bible.world as w}
				<div class="card p-4">
					<div class="flex items-center justify-between">
						<span class="chip !text-[9px]">{w.category}</span>
						<Icon name="globe" size={15} class="text-faint" />
					</div>
					<h3 class="mt-2 font-display text-[17px] text-ink">{w.name}</h3>
					<p class="mt-1.5 text-[11px] leading-relaxed text-muted">{w.description}</p>
					<div class="mt-3 rounded-md border border-gold/15 bg-gold/[0.04] p-2.5">
						<p class="text-[9px] uppercase tracking-[0.08em] text-gold">Rule</p>
						<p class="mt-0.5 text-[10.5px] leading-relaxed text-muted">{w.rules}</p>
					</div>
				</div>
			{/each}
		</div>
		<div class="card mt-4 p-5">
			<h3 class="font-display text-[18px] text-ink">Glossary</h3>
			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				{#each book.bible.glossary as g}
					<div class="rounded-lg border border-line bg-white/[0.02] p-3">
						<p class="text-[11px] font-medium text-ink">{g.term}</p>
						<p class="mt-1 text-[10px] leading-relaxed text-muted">{g.definition}</p>
					</div>
				{/each}
			</div>
		</div>
	{:else if tab === 'canon'}
		<div class="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
			<div class="card overflow-hidden">
				<div class="border-b border-line px-5 py-3.5">
					<h3 class="font-display text-[18px] text-ink">Canon locks</h3>
					<p class="mt-0.5 text-[10.5px] text-faint">Invariants enforced by the consistency auditor.</p>
				</div>
				{#each book.bible.canon as c}
					<div class="flex items-start gap-3 border-b border-line px-5 py-3 last:border-0">
						<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md {c.status === 'locked' ? 'bg-gold/10 text-gold' : 'bg-white/[0.04] text-faint'}"><Icon name="lock" size={12} /></span>
						<div class="min-w-0 flex-1">
							<p class="text-[11.5px] leading-relaxed text-ink">{c.rule}</p>
							<p class="mt-1 text-[9.5px] text-faint">{c.scope}</p>
						</div>
						<button class="chip !text-[8.5px] {c.status === 'locked' ? 'chip-gold' : ''}" onclick={() => { c.status = c.status === 'locked' ? 'flexible' : 'locked'; studio.updateBook(book.id, {}); }}>{c.status}</button>
					</div>
				{/each}
			</div>
			<div class="card p-5">
				<h3 class="font-display text-[18px] text-ink">How canon is enforced</h3>
				<ol class="mt-3 space-y-3">
					{#each [['Before drafting', 'The chapter writer receives the canon digest and the relevant entity facts.'], ['After drafting', 'The narrative graph is rebuilt and invariants are checked.'], ['On conflict', 'A finding is raised by severity. High severity pauses the pipeline.'], ['On resolution', 'A human chooses: revise the chapter, revise canon, or add a bridging scene.']] as [t, d], i}
						<div class="flex gap-2.5">
							<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[8px] text-gold">{i + 1}</span>
							<div><p class="text-[11px] text-ink">{t}</p><p class="mt-0.5 text-[10px] leading-relaxed text-muted">{d}</p></div>
						</div>
					{/each}
				</ol>
			</div>
		</div>
	{:else}
		<div class="card p-5">
			<h3 class="font-display text-[18px] text-ink">Timeline</h3>
			<div class="mt-5 space-y-0">
				{#each book.bible.timeline as t, i}
					<div class="relative flex gap-4 pb-6 last:pb-0">
						{#if i < book.bible.timeline.length - 1}<span class="absolute left-[5px] top-3 h-full w-px bg-line"></span>{/if}
						<span class="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-gold/40 bg-gold/20"></span>
						<div>
							<p class="text-[10px] uppercase tracking-[0.1em] text-gold">{t.when}</p>
							<p class="mt-1 text-[12px] leading-relaxed text-muted">{t.event}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="card mt-4 p-5">
			<h3 class="font-display text-[18px] text-ink">Style guide</h3>
			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				{#each Object.entries(book.bible.styleGuide) as [k, v]}
					<div class="rounded-lg border border-line bg-white/[0.02] p-3">
						<p class="text-[9px] uppercase tracking-[0.1em] text-faint">{k}</p>
						<p class="mt-1 text-[10.5px] leading-relaxed text-muted">{v}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/if}
