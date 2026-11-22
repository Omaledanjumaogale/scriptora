<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import { startPipeline } from '$lib/pipeline';
import Progress from '$lib/components/Progress.svelte';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
let filter = $state('all');
let query = $state('');

const chapters = $derived(
	book
		? book.chapters
				.filter((c) => (filter === 'all' ? true : filter === 'draft' ? c.content : filter === 'planned' ? !c.content : c.status === filter))
				.filter((c) => !query || (c.title + c.summary).toLowerCase().includes(query.toLowerCase()))
		: []
);

const drafted = $derived(book?.chapters.filter((c) => c.content).length ?? 0);
const approvedCount = $derived(book?.chapters.filter((c) => c.status === 'approved').length ?? 0);

function draftAll() {
	if (!book) return;
	const ids = book.chapters.filter((c) => !c.content).map((c) => c.id);
	startPipeline(book.id, 'chapters', { chapterIds: ids, speed: 1.6 });
	studio.notify(`Drafting ${ids.length} remaining chapters`);
	goto(`/app/books/${book.id}/studio`);
}
</script>

	<svelte:head><title>Chapters — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Manuscript" title="Chapter ledger" description="{drafted} of {book.chapters.length} chapters drafted · {approvedCount} approved · {book.wordCount.toLocaleString()} words on the page.">
		<button class="btn btn-secondary" onclick={() => goto(`/app/books/${book.id}/exports`)}><Icon name="download" size={14} /> Export</button>
		<button class="btn btn-primary" onclick={draftAll}><Icon name="sparkles" size={14} /> Draft remaining</button>
	</PageHeader>

	<div class="mb-5 grid gap-3 sm:grid-cols-4">
		{#each [
			{ label: 'Drafted', value: `${drafted}/${book.chapters.length}`, note: 'chapters with prose' },
			{ label: 'Words', value: book.wordCount.toLocaleString(), note: `target ${book.targetWords.toLocaleString()}` },
			{ label: 'Approved', value: String(approvedCount), note: 'locked by human' },
			{ label: 'Scene circuits', value: `${book.craft.sceneCircuits.reduce((s, c) => s + c.complete, 0)}/${book.craft.sceneCircuits.reduce((s, c) => s + c.total, 0)}`, note: 'complete circuits' }
		] as s}
			<div class="card p-4">
				<p class="text-[9px] uppercase tracking-[0.12em] text-faint">{s.label}</p>
				<p class="mt-1.5 font-display text-[22px] text-ink">{s.value}</p>
				<p class="text-[10px] text-faint">{s.note}</p>
			</div>
		{/each}
	</div>

	<div class="card overflow-hidden">
		<div class="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
			<div class="flex flex-wrap gap-1.5">
				{#each [['all', 'All'], ['draft', 'With prose'], ['planned', 'Planned'], ['drafted', 'Drafted'], ['approved', 'Approved']] as [k, l]}
					<button class="chip !text-[9.5px] {filter === k ? 'chip-gold' : ''}" onclick={() => (filter = k)}>{l}</button>
				{/each}
			</div>
			<div class="relative sm:ml-auto sm:w-[220px]">
				<Icon name="search" size={13} class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
				<input class="input !py-1.5 !pl-8 !text-[11px]" placeholder="Find a chapter…" bind:value={query} />
			</div>
		</div>

		{#each chapters as ch}
			<button class="table-row flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.02]" onclick={() => goto(`/app/books/${book.id}/chapters/${ch.id}`)}>
				<span class="mono mt-1 w-7 shrink-0 text-[10px] text-faint">{String(ch.number).padStart(2, '0')}</span>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-[12.5px] font-medium text-ink">{ch.title}</p>
						<span class="chip !px-1.5 !py-0 !text-[8px] capitalize {ch.status === 'approved' ? 'chip-success' : ch.status === 'edited' ? 'chip-teal' : ch.status === 'drafted' ? 'chip-gold' : ''}">{ch.status}</span>
						{#if ch.content}<span class="text-[9px] text-faint">{ch.wordCount.toLocaleString()}w</span>{/if}
					</div>
					<p class="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{ch.summary}</p>
					<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-faint">
						<span>{ch.scenes.length} scenes</span>
						<span>{ch.part}</span>
						<span>POV: {ch.pov}</span>
						<span>Target {ch.targetWords.toLocaleString()}w</span>
					</div>
					{#if ch.content}
						<div class="mt-2 max-w-[240px]">
							<Progress value={(ch.wordCount / ch.targetWords) * 100} height={3} tone={ch.wordCount >= ch.targetWords ? 'teal' : 'gold'} />
						</div>
					{/if}
				</div>
				<div class="hidden shrink-0 items-center gap-1.5 pt-1 sm:flex">
					{#each ch.scenes.slice(0, 3) as scene}
						<span class="h-1.5 w-1.5 rounded-full" class:bg-teal={scene.status === 'drafted'} class:bg-line-strong={scene.status === 'planned'} title={scene.title}></span>
					{/each}
				</div>
				<Icon name="chevron-right" size={14} class="mt-1 shrink-0 text-faint" />
			</button>
		{/each}
		{#if !chapters.length}
			<p class="px-4 py-14 text-center text-[12px] text-faint">No chapters match this filter.</p>
		{/if}
	</div>
{/if}
