<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import { startPipeline } from '$lib/pipeline';
import { uid } from '$lib/seed';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import type { Chapter } from '$lib/types';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
const parts = $derived.by(() => {
	const b = book;
	if (!b) return [] as { name: string; chapters: Chapter[] }[];
	const map = new Map<string, Chapter[]>();
	for (const c of b.chapters) {
		if (!map.has(c.part)) map.set(c.part, []);
		map.get(c.part)!.push(c);
	}
	return [...map.entries()].map(([name, chapters]) => ({ name, chapters }));
});
let expanded = $state<string[]>(['ch-1']);

function toggle(chapterId: string) {
	expanded = expanded.includes(chapterId) ? expanded.filter((x) => x !== chapterId) : [...expanded, chapterId];
}

function fullDraft() {
	if (!book) return;
	startPipeline(book.id, 'full-book', { speed: 1.1 });
	studio.notify('Full book pipeline started');
	goto(`/app/books/${book.id}/studio`);
}

function addChapter() {
	if (!book) return;
	const n = book.chapters.length + 1;
	const part = book.chapters.at(-1)?.part ?? 'Part I — The Ordinary World';
	book.chapters.push({
		id: uid('ch'),
		number: n,
		part,
		title: `Chapter ${n}`,
		summary: 'New chapter — add a purpose and scene plan before drafting.',
		purpose: 'TBD',
		pov: 'Third limited',
		status: 'planned',
		wordCount: 0,
		targetWords: Math.round(book.targetWords / (n || 1)),
		content: '',
		scenes: [],
		updatedAt: new Date().toISOString()
	});
	studio.updateBook(book.id, {});
	studio.notify('Chapter added');
}
</script>

	<svelte:head><title>Outline — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Architecture" title="{book.chapters.length} chapters, {book.chapters.length * 3} scenes." description="The outline is a working document. Every chapter has a purpose in the arc; every scene must complete a circuit of change before it is drafted.">
		<button class="btn btn-secondary" onclick={addChapter}><Icon name="plus" size={14} /> Add chapter</button>
		<button class="btn btn-primary" onclick={fullDraft}><Icon name="sparkles" size={14} /> Draft full manuscript</button>
	</PageHeader>

	<div class="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
		<div class="space-y-6">
			{#each parts as part, pi}
				<div>
					<div class="mb-2.5 flex items-center gap-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.07] font-mono text-[9px] text-gold">{String.fromCharCode(65 + pi)}</span>
						<h2 class="font-display text-[19px] text-ink">{part.name}</h2>
						<span class="text-[10px] text-faint">{part.chapters.length} chapters · {part.chapters.reduce((s: number, c: Chapter) => s + c.targetWords, 0).toLocaleString()} target words</span>
					</div>
					<div class="space-y-2">
						{#each part.chapters as ch}
							<div class="card overflow-hidden">
								<button class="flex w-full items-center gap-3 px-4 py-3 text-left" onclick={() => toggle(ch.id)}>
									<span class="mono w-6 shrink-0 text-[10px] text-faint">{String(ch.number).padStart(2, '0')}</span>
									<div class="min-w-0 flex-1">
										<p class="truncate text-[12.5px] text-ink">{ch.title}</p>
										<p class="mt-0.5 line-clamp-1 text-[10px] text-faint">{ch.summary}</p>
									</div>
									<span class="chip hidden !px-1.5 !py-0.5 !text-[8.5px] sm:inline-flex">{ch.scenes.length} scenes</span>
									<span class="chip !px-1.5 !py-0.5 !text-[8.5px] capitalize {ch.status === 'approved' ? 'chip-success' : ch.status === 'drafted' || ch.status === 'edited' ? 'chip-teal' : ''}">{ch.status}</span>
									<Icon name="chevron-down" size={14} class="shrink-0 text-faint transition-transform {expanded.includes(ch.id) ? 'rotate-180' : ''}" />
								</button>
								{#if expanded.includes(ch.id)}
									<div class="border-t border-line bg-canvas/30 px-4 py-3">
										<div class="grid gap-3 sm:grid-cols-[1fr_1fr]">
											<div>
												<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Purpose in the arc</p>
												<p class="mt-1 text-[10.5px] leading-relaxed text-muted">{ch.purpose}</p>
											</div>
											<div>
												<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Chapter summary</p>
												<p class="mt-1 text-[10.5px] leading-relaxed text-muted">{ch.summary}</p>
											</div>
										</div>
										<div class="mt-3 space-y-1.5">
											{#each ch.scenes as scene, si}
												<div class="flex items-start gap-2.5 rounded-md border border-line bg-white/[0.02] px-2.5 py-2">
													<span class="mono mt-0.5 text-[8.5px] text-gold">{String(si + 1).padStart(2, '0')}</span>
													<div class="min-w-0 flex-1">
														<p class="text-[10.5px] text-ink">{scene.title}</p>
														<p class="mt-0.5 text-[9.5px] leading-relaxed text-faint">{scene.summary}</p>
													</div>
													<span class="chip !px-1.5 !py-0 !text-[8px] {scene.status === 'drafted' ? 'chip-teal' : ''}">{scene.status}</span>
												</div>
											{/each}
											{#if !ch.scenes.length}
												<p class="rounded-md border border-dashed border-line px-3 py-3 text-center text-[10px] text-faint">No scenes yet. Run the blueprint to map circuits.</p>
											{/if}
										</div>
										<div class="mt-3 flex justify-end gap-2">
											<button class="btn btn-ghost btn-sm" onclick={() => goto(`/app/books/${book.id}/chapters/${ch.id}`)}>Open chapter</button>
											<button class="btn btn-secondary btn-sm" onclick={() => { startPipeline(book.id, 'draft', { chapterIds: [ch.id], speed: 1.4 }); studio.notify(`Drafting ${ch.title}`); }}><Icon name="play" size={11} /> Draft this chapter</button>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- rail -->
		<div class="space-y-5">
			<div class="card p-5">
				<p class="eyebrow">Structure health</p>
				<div class="mt-3 space-y-3">
					{#each [['Turning points', '4 placed', 92], ['Scene circuits', '32 / 36 complete', 89], ['POV balance', '68 / 32', 76], ['Chapter length spread', 'Low variance', 84]] as [label, value, pct]}
						<div>
							<div class="flex items-center justify-between text-[10px]">
								<span class="text-muted">{label}</span><span class="text-faint">{value}</span>
							</div>
							<div class="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div class="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style="width:{pct}%"></div></div>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<p class="eyebrow">Scene circuit</p>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">The eight beats a scene must complete to earn its place.</p>
				<div class="mt-3 grid grid-cols-2 gap-1.5">
					{#each ['You', 'Need', 'Go', 'Search', 'Find', 'Take', 'Return', 'Change'] as beat, i}
						<div class="flex items-center gap-1.5 rounded-md border border-line bg-white/[0.02] px-2 py-1.5">
							<span class="mono text-[8px] text-gold">{i + 1}</span>
							<span class="text-[10px] text-muted">{beat}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<p class="eyebrow">Drafting configuration</p>
				<div class="mt-3 space-y-2 text-[10.5px]">
					<div class="flex justify-between"><span class="text-faint">Chapters</span><span class="mono text-ink">{book.chapters.length}</span></div>
					<div class="flex justify-between"><span class="text-faint">Target words</span><span class="mono text-ink">{book.targetWords.toLocaleString()}</span></div>
					<div class="flex justify-between"><span class="text-faint">Avg. chapter</span><span class="mono text-ink">{Math.round(book.targetWords / book.chapters.length).toLocaleString()}</span></div>
					<div class="flex justify-between"><span class="text-faint">Scenes</span><span class="mono text-ink">{book.chapters.reduce((s, c) => s + c.scenes.length, 0)}</span></div>
				</div>
				<button class="btn btn-primary mt-4 w-full" onclick={fullDraft}><Icon name="zap" size={14} /> Draft entire book</button>
			</div>
		</div>
	</div>
{/if}
