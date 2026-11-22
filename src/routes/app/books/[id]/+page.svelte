<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import { STAGES, countWords } from '$lib/engine';
import BookCover from '$lib/components/BookCover.svelte';
import Progress from '$lib/components/Progress.svelte';
import Donut from '$lib/components/Donut.svelte';
import Icon from '$lib/components/Icon.svelte';
import Avatar from '$lib/components/Avatar.svelte';
import { startPipeline } from '$lib/pipeline';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
const runs = $derived(studio.runs.filter((r) => r.bookId === id));
const drafted = $derived(book ? book.chapters.filter((c) => c.content.trim()).length : 0);
const stageIdx = $derived(book ? STAGES.findIndex((s) => s.key === book.stage) : 0);
const nextStage = $derived(book ? STAGES[Math.min(STAGES.length - 1, stageIdx + 1)] : undefined);

const nextAction = $derived.by(() => {
	if (!book) return null;
	if (book.stage === 'concept' || book.stage === 'blueprint')
		return { title: 'Approve the blueprint', body: 'Six characters, world rules, canon locks and a chapter plan are ready for your review.', cta: 'Review blueprint', href: `/app/books/${book.id}/blueprint`, run: 'blueprint' };
	if (book.stage === 'outline')
		return { title: 'Draft the complete manuscript', body: `${book.chapters.length} chapters and ${book.chapters.length * 3} scenes are mapped. Run the full production pipeline.`, cta: 'Start full draft', href: `/app/books/${book.id}/studio`, run: 'full-book' };
	if (book.stage === 'drafting')
		return { title: 'Resolve continuity, then edit', body: `${book.craft.continuity?.filter((c) => c.severity === 'high').length ?? 0} high-severity findings are open. The editorial agent can run a full pass.`, cta: 'Run editorial pass', href: `/app/books/${book.id}/studio`, run: 'editorial' };
	if (book.stage === 'editing')
		return { title: 'Lock the editorial pass', body: 'One high-severity continuity finding is waiting for your decision before the manuscript can be locked.', cta: 'Open craft report', href: `/app/books/${book.id}/craft`, run: 'editorial' };
	if (book.stage === 'design')
		return { title: 'Package the export', body: 'The cover is selected. Assemble front and back matter, then build EPUB and print PDF.', cta: 'Build export', href: `/app/books/${book.id}/exports`, run: 'export' };
	return { title: 'Book is published', body: 'This title has left the studio. Open the export archive to download the final files.', cta: 'Open archive', href: `/app/books/${book.id}/exports`, run: null };
});

function run(kind: string) {
	if (!book) return;
	startPipeline(book.id, kind as 'blueprint' | 'full-book' | 'editorial' | 'export', { speed: 1.2 });
	studio.notify('Pipeline started');
	goto(`/app/books/${book.id}/studio`);
}
</script>

	<svelte:head><title>{book?.title} — Scriptora</title></svelte:head>

{#if book}

	<div class="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">
		<div class="space-y-5">
			<!-- next action -->
			{#if nextAction}
				<div class="card relative overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.06] via-panel to-panel p-5">
					<div class="pointer-events-none absolute right-0 top-0 h-[180px] w-[240px] rounded-full bg-gold/[0.07] blur-[70px]"></div>
					<div class="relative flex flex-col gap-4 sm:flex-row sm:items-center">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold"><Icon name="lightbulb" size={18} /></span>
						<div class="min-w-0 flex-1">
							<p class="eyebrow">Next best action</p>
							<h2 class="mt-1 font-display text-[19px] text-ink">{nextAction.title}</h2>
							<p class="mt-1 text-[11.5px] leading-relaxed text-muted">{nextAction.body}</p>
						</div>
						<div class="flex shrink-0 gap-2">
							<button class="btn btn-secondary" onclick={() => goto(nextAction.href)}>{nextAction.cta}</button>
							{#if nextAction.run}<button class="btn btn-primary" onclick={() => run(nextAction.run!)}><Icon name="play" size={13} /> Run</button>{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- premise -->
			<div class="card p-5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 class="font-display text-[20px] text-ink">The promise of the book</h2>
					<button class="text-[10.5px] text-gold hover:underline" onclick={() => goto(`/app/books/${book.id}/blueprint`)}>Edit blueprint</button>
				</div>
				<p class="mt-3 font-display text-[15px] leading-relaxed text-ink/90">{book.logline}</p>
				<p class="mt-3 text-[12px] leading-[1.8] text-muted">{book.premise}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each book.themes as theme}<span class="chip">{theme}</span>{/each}
				</div>
				<div class="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Reader promise</p>
						<p class="mt-1 text-[11.5px] leading-relaxed text-muted">{book.hooks[0]}</p>
					</div>
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Audience</p>
						<p class="mt-1 text-[11.5px] leading-relaxed text-muted">{book.audience}</p>
					</div>
				</div>
			</div>

			<!-- chapters -->
			<div class="card">
				<div class="flex items-center justify-between border-b border-line px-5 py-3.5">
					<div>
						<h2 class="font-display text-[18px] text-ink">Chapter ledger</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">{drafted} of {book.chapters.length} chapters have prose · {book.wordCount.toLocaleString()} words</p>
					</div>
					<button class="btn btn-secondary btn-sm" onclick={() => goto(`/app/books/${book.id}/chapters`)}>Open all</button>
				</div>
				<div class="max-h-[360px] overflow-y-auto">
					{#each book.chapters as ch}
						<button class="table-row flex w-full items-center gap-3 px-5 py-2.5 text-left" onclick={() => goto(`/app/books/${book.id}/chapters/${ch.id}`)}>
							<span class="mono w-6 shrink-0 text-[10px] text-faint">{String(ch.number).padStart(2, '0')}</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-[11.5px] text-ink">{ch.title}</span>
								<span class="block truncate text-[9.5px] text-faint">{ch.scenes.length} scenes · {ch.purpose.slice(0, 62)}…</span>
							</span>
							<span class="mono hidden text-[10px] text-muted sm:block">{ch.wordCount.toLocaleString()}w</span>
							<span class="chip !px-1.5 !py-0.5 !text-[8.5px] capitalize {ch.status === 'approved' ? 'chip-success' : ch.status === 'edited' ? 'chip-teal' : ch.status === 'drafted' ? 'chip-gold' : ''}">{ch.status}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- characters -->
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<h2 class="font-display text-[18px] text-ink">Character system</h2>
					<button class="text-[10.5px] text-gold hover:underline" onclick={() => goto(`/app/books/${book.id}/bible`)}>Full bible</button>
				</div>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					{#each book.bible.characters.filter((c) => c.tier <= 2).slice(0, 4) as c}
						<div class="flex gap-2.5 rounded-lg border border-line bg-white/[0.02] p-3">
							<Avatar name={c.name} hue={38} size={32} />
							<div class="min-w-0">
								<p class="truncate text-[11.5px] text-ink">{c.name}</p>
								<p class="truncate text-[9.5px] text-faint">{c.occupation}</p>
								<p class="mt-1 line-clamp-1 text-[9.5px] text-muted">{c.want}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- right rail -->
		<div class="space-y-5">
			<div class="card p-5">
				<div class="flex items-center gap-4">
					<BookCover book={book} size="sm" />
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Production</p>
						<p class="mt-1 font-display text-[17px] text-ink capitalize">{book.stage}</p>
						<p class="mt-0.5 text-[10px] text-muted">Next: {nextStage?.label}</p>
					</div>
				</div>
				<div class="mt-4 space-y-2">
					{#each STAGES as s, i}
						<div class="flex items-center gap-2.5">
							<span class="flex h-4 w-4 items-center justify-center rounded-full text-[8px] {i < stageIdx ? 'bg-teal/15 text-teal' : i === stageIdx ? 'bg-gold/20 text-gold' : 'border border-line text-faint'}">
								{#if i < stageIdx}<Icon name="check" size={8} />{:else}{i + 1}{/if}
							</span>
							<span class="text-[10.5px] {i <= stageIdx ? 'text-ink' : 'text-faint'}">{s.label}</span>
							{#if i === stageIdx}<span class="ml-auto text-[8px] uppercase tracking-[0.1em] text-gold">Current</span>{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<div class="flex items-center justify-between">
					<h3 class="text-[12px] font-semibold text-ink">Editorial health</h3>
					<span class="chip chip-teal !text-[9px]">{book.quality}/100</span>
				</div>
				<div class="mt-4 flex items-center gap-4">
					<Donut value={book.quality} size={78} label="Score" />
					<div class="flex-1 space-y-2">
						<div>
							<div class="flex justify-between text-[9px] text-faint"><span>Voice integrity</span><span class="mono">{book.craft.aiismScore}%</span></div>
							<Progress value={book.craft.aiismScore} tone="teal" height={3} />
						</div>
						<div>
							<div class="flex justify-between text-[9px] text-faint"><span>Readability</span><span class="mono">{book.craft.readability}</span></div>
							<Progress value={book.craft.readability} tone="violet" height={3} />
						</div>
						<div>
							<div class="flex justify-between text-[9px] text-faint"><span>Scene circuits</span><span class="mono">{book.craft.sceneCircuits.reduce((s, c) => s + c.complete, 0)}/{book.craft.sceneCircuits.reduce((s, c) => s + c.total, 0)}</span></div>
							<Progress value={(book.craft.sceneCircuits.reduce((s, c) => s + c.complete, 0) / Math.max(1, book.craft.sceneCircuits.reduce((s, c) => s + c.total, 0))) * 100} height={3} />
						</div>
					</div>
				</div>
				<button class="btn btn-secondary btn-sm mt-4 w-full" onclick={() => goto(`/app/books/${book.id}/craft`)}>Open craft report</button>
			</div>

			<div class="card">
				<div class="flex items-center justify-between border-b border-line px-4 py-3">
					<h3 class="text-[12px] font-semibold text-ink">Recent runs</h3>
					<button class="text-[10px] text-gold hover:underline" onclick={() => goto(`/app/books/${book.id}/studio`)}>All</button>
				</div>
				{#if runs.length}
					{#each runs.slice(0, 3) as r}
						<div class="flex items-center gap-2.5 border-b border-line px-4 py-2.5 last:border-0">
							<Icon name={r.status === 'complete' ? 'check-circle' : r.status === 'paused' ? 'pause' : 'loader'} size={13} class={r.status === 'complete' ? 'text-teal' : r.status === 'paused' ? 'text-warning' : 'animate-spin text-gold'} />
							<div class="min-w-0 flex-1">
								<p class="truncate text-[10.5px] text-ink">{r.pipeline}</p>
								<p class="text-[9px] text-faint">{new Date(r.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${r.cost.toFixed(2)}</p>
							</div>
						</div>
					{/each}
				{:else}
					<p class="px-4 py-5 text-center text-[10.5px] text-faint">No runs yet. Start with the blueprint.</p>
				{/if}
			</div>

			<div class="card p-4">
				<h3 class="text-[12px] font-semibold text-ink">Production record</h3>
				<div class="mt-3 space-y-2 text-[10px]">
					<div class="flex justify-between"><span class="text-faint">Created</span><span class="text-muted">{new Date(book.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
					<div class="flex justify-between"><span class="text-faint">Last edit</span><span class="text-muted">{new Date(book.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
					<div class="flex justify-between"><span class="text-faint">Trim size</span><span class="text-muted">{book.trimSize}</span></div>
					<div class="flex justify-between"><span class="text-faint">Language</span><span class="text-muted">{book.language}</span></div>
					<div class="flex justify-between"><span class="text-faint">ISBN</span><span class="mono text-muted">{book.isbn || 'Not assigned'}</span></div>
					<div class="flex justify-between"><span class="text-faint">Words</span><span class="mono text-muted">{countWords(book.chapters.map((c) => c.content).join(' ')).toLocaleString()}</span></div>
				</div>
			</div>
		</div>
	</div>
{/if}
