<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { startPipeline } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import Donut from '$lib/components/Donut.svelte';
import Progress from '$lib/components/Progress.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));

function runEditorial() {
	if (!book) return;
	startPipeline(book.id, 'editorial', { speed: 1.3 });
	studio.notify('Editorial pass started');
}

function toggleProtocol(protocolId: string) {
	if (!book) return;
	const p = book.craft.protocols.find((x) => x.id === protocolId);
	if (p) p.enabled = !p.enabled;
	studio.updateBook(book.id, {});
}

function resolve(index: number) {
	if (!book) return;
	book.craft.continuity.splice(index, 1);
	studio.updateBook(book.id, {});
	studio.notify('Finding resolved and logged');
}

const severityTone: Record<string, string> = { high: 'text-danger bg-danger/10', medium: 'text-warning bg-warning/10', low: 'text-faint bg-white/[0.04]' };
</script>

	<svelte:head><title>Craft — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Craft engine" title="The editorial control room." description="Eight protocols, five craft lenses and a continuity auditor reading the same canon. Findings are ranked by severity; nothing high-severity ships without a human decision.">
		<button class="btn btn-secondary" onclick={() => studio.regenerateCraft(book.id)}><Icon name="refresh" size={14} /> Refresh analysis</button>
		<button class="btn btn-primary" onclick={runEditorial}><Icon name="feather" size={14} /> Run editorial pass</button>
	</PageHeader>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div class="card flex items-center gap-4 p-4">
			<Donut value={book.craft.aiismScore} size={72} label="Voice" color="#7dd3c0" />
			<div><p class="text-[11px] font-medium text-ink">Voice integrity</p><p class="mt-1 text-[10px] leading-relaxed text-muted">AI-ism suppression and semantic-gradient sweep.</p></div>
		</div>
		<div class="card flex items-center gap-4 p-4">
			<Donut value={book.craft.readability} size={72} label="Read" color="#a78bfa" />
			<div><p class="text-[11px] font-medium text-ink">Readability</p><p class="mt-1 text-[10px] leading-relaxed text-muted">Flesch-style band for the target audience.</p></div>
		</div>
		<div class="card flex items-center gap-4 p-4">
			<Donut value={(book.craft.sceneCircuits.reduce((s, c) => s + c.complete, 0) / Math.max(1, book.craft.sceneCircuits.reduce((s, c) => s + c.total, 0))) * 100} size={72} label="Scenes" />
			<div><p class="text-[11px] font-medium text-ink">Scene circuits</p><p class="mt-1 text-[10px] leading-relaxed text-muted">{book.craft.sceneCircuits.reduce((s, c) => s + c.complete, 0)} of {book.craft.sceneCircuits.reduce((s, c) => s + c.total, 0)} complete.</p></div>
		</div>
		<div class="card flex items-center gap-4 p-4">
			<Donut value={100 - book.craft.continuity.length * 12} size={72} label="Canon" color="#f0a0a8" />
			<div><p class="text-[11px] font-medium text-ink">Continuity</p><p class="mt-1 text-[10px] leading-relaxed text-muted">{book.craft.continuity.length} open findings across the manuscript.</p></div>
		</div>
	</div>

	<div class="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
		<div class="space-y-5">
			<!-- pacing -->
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-[19px] text-ink">Pacing & tension curve</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">Chapter-level tension score with editorial notes.</p>
					</div>
					<span class="chip !text-[9px]">Yorke five-act</span>
				</div>
				<div class="mt-5 flex h-[180px] items-end gap-1.5">
					{#each book.craft.pacing as p, i}
						<div class="group relative flex flex-1 flex-col items-center justify-end" style="height:100%">
							<div class="absolute bottom-full mb-1 hidden w-[150px] rounded-md border border-line-strong bg-panel-3 p-2 text-[9px] leading-relaxed text-muted shadow-xl group-hover:block z-10">
								<p class="font-medium text-ink">{p.chapter} · {p.tension}/100</p>
								<p class="mt-1">{p.note}</p>
							</div>
							<div class="w-full rounded-t-[2px] transition-all duration-300 hover:opacity-100" style="height:{p.tension}%;background:{p.tension > 78 ? 'linear-gradient(180deg,#f0a0a8,#c2586a)' : p.tension < 52 ? 'linear-gradient(180deg,#6b7484,#3a4250)' : 'linear-gradient(180deg,#efca8a,#b98f4a)'};opacity:.85"></div>
							<span class="mt-1.5 text-[8px] text-faint">{i + 1}</span>
						</div>
					{/each}
				</div>
				<div class="mt-3 flex items-center gap-4 text-[9px] text-faint">
					<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-gold"></span> Building</span>
					<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-rose"></span> Peak</span>
					<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-faint"></span> Reflective</span>
				</div>
			</div>

			<!-- continuity -->
			<div class="card overflow-hidden">
				<div class="flex items-center justify-between border-b border-line px-5 py-3.5">
					<div>
						<h2 class="font-display text-[18px] text-ink">Continuity findings</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">Narrative graph + canon invariant checks.</p>
					</div>
					<span class="chip chip-rose !text-[9px]">{book.craft.continuity.length} open</span>
				</div>
				{#each book.craft.continuity as c, i}
					<div class="flex items-start gap-3 border-b border-line px-5 py-3 last:border-0">
						<span class="mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase {severityTone[c.severity]}">{c.severity}</span>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] leading-relaxed text-ink">{c.message}</p>
							<p class="mt-0.5 text-[9px] text-faint">{c.where}</p>
						</div>
						<button class="btn btn-secondary btn-sm" onclick={() => resolve(i)}>Resolve</button>
					</div>
				{/each}
				{#if !book.craft.continuity.length}
					<div class="px-5 py-10 text-center">
						<Icon name="check-circle" size={24} class="mx-auto text-teal" />
						<p class="mt-2 text-[12px] text-ink">No open continuity findings.</p>
						<p class="mt-0.5 text-[10px] text-faint">The manuscript is consistent with the current canon lock.</p>
					</div>
				{/if}
			</div>

			<!-- protocols -->
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-[19px] text-ink">Craft protocols</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">The active lenses. Disable deliberately; each one shapes drafting and revision.</p>
					</div>
					<span class="chip chip-teal !text-[9px]">{book.craft.protocols.filter((p) => p.enabled).length}/{book.craft.protocols.length} active</span>
				</div>
				<div class="mt-4 grid gap-2 sm:grid-cols-2">
					{#each book.craft.protocols as p}
						<button class="flex items-start gap-3 rounded-lg border border-line bg-white/[0.02] p-3 text-left transition hover:border-line-strong" onclick={() => toggleProtocol(p.id)}>
							<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md {p.enabled ? 'bg-teal/15 text-teal' : 'bg-white/[0.04] text-faint'}">
								{#if p.enabled}<Icon name="check" size={11} />{:else}<Icon name="x" size={11} />{/if}
							</span>
							<div class="min-w-0">
								<p class="text-[11px] text-ink">{p.name}</p>
								<p class="mt-0.5 text-[9.5px] leading-relaxed text-faint">{p.note}</p>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="space-y-5">
			<div class="card p-5">
				<h3 class="font-display text-[17px] text-ink">Genre routing</h3>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">{book.genre}. Protocols are routed by genre so the engine never applies a fiction gate to nonfiction.</p>
				<div class="mt-3 space-y-1.5">
					{#each book.craft.genreRouting as r}
						<div class="flex items-center justify-between rounded-md border border-line bg-white/[0.02] px-2.5 py-1.5">
							<span class="text-[10px] text-muted">{r.protocol}</span>
							<span class="chip !px-1.5 !py-0 !text-[8px] capitalize {r.applies === 'core' ? 'chip-gold' : r.applies === 'skip' ? 'chip-rose' : ''}">{r.applies}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<h3 class="font-display text-[17px] text-ink">Scene circuits by chapter</h3>
				<div class="mt-3 space-y-2">
					{#each book.craft.sceneCircuits as s}
						<div>
							<div class="flex justify-between text-[9px] text-faint"><span>{s.chapter}</span><span class="mono">{s.complete}/{s.total}</span></div>
							<Progress value={(s.complete / s.total) * 100} height={3} tone={s.complete === s.total ? 'teal' : 'gold'} />
						</div>
					{/each}
				</div>
			</div>

			<div class="card border-warning/20 bg-warning/[0.04] p-5">
				<p class="flex items-center gap-2 text-[11.5px] font-medium text-warning"><Icon name="shield" size={14} /> Approval gate</p>
				<p class="mt-2 text-[10.5px] leading-relaxed text-muted">High-severity findings block export. Resolve them here, or open the chapter to add a bridging scene.</p>
				<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={runEditorial}><Icon name="play" size={12} /> Re-run editorial audit</button>
			</div>

			<div class="card p-5">
				<h3 class="font-display text-[17px] text-ink">AI-ism sweep</h3>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">Most common patterns found in the current manuscript.</p>
				<div class="mt-3 space-y-2">
					{#each [['Filter words (very, really)', 12], ['“Began to” constructions', 8], ['Thematic summary at chapter end', 5], ['Rule-of-three lists', 4], ['Abstract nouns in action beats', 7]] as [label, count]}
						<div class="flex items-center justify-between text-[10px]"><span class="text-muted">{label}</span><span class="mono text-faint">{count}</span></div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
