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
const totalCost = $derived(book ? book.research.costEstimate.reduce((s, c) => s + c.value, 0) : 0);

function rerun() {
	if (!book) return;
	startPipeline(book.id, 'research', { speed: 1.6 });
	studio.notify('Market research pipeline started');
}
</script>

	<svelte:head><title>Market — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Market intelligence" title="Know the shelf before you ship." description="Comparable titles, keyword opportunity, demand and competition scoring, price bands, sales channels and a chapter-level production cost estimate.">
		<button class="btn btn-secondary" onclick={rerun}><Icon name="refresh" size={14} /> Rerun research</button>
		<button class="btn btn-primary" onclick={() => studio.notify('Positioning brief copied to blueprint')}><Icon name="copy" size={14} /> Apply to blueprint</button>
	</PageHeader>

	<div class="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
		<div class="space-y-5">
			<div class="card p-5">
				<div class="grid gap-5 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
					<Donut value={book.research.demandScore} size={92} label="Demand" />
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Demand score</p>
						<p class="mt-1 font-display text-[26px] text-ink">{book.research.demandScore}<span class="text-[13px] text-faint">/100</span></p>
						<p class="mt-1 text-[10px] leading-relaxed text-muted">Steady search interest with a durable book-club tail.</p>
					</div>
					<div class="border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Competition</p>
						<p class="mt-1 font-display text-[26px] text-ink">{book.research.competitionScore}<span class="text-[13px] text-faint">/100</span></p>
						<p class="mt-1 text-[10px] leading-relaxed text-muted">Crowded category; differentiation must lead with voice.</p>
					</div>
				</div>
				<div class="mt-4 rounded-lg border border-line bg-white/[0.02] p-3.5">
					<p class="text-[9px] uppercase tracking-[0.1em] text-gold">Positioning</p>
					<p class="mt-1 text-[11px] leading-relaxed text-muted">{book.research.positioning}</p>
				</div>
			</div>

			<!-- keywords -->
			<div class="card overflow-hidden">
				<div class="flex items-center justify-between border-b border-line px-5 py-3.5">
					<div>
						<h2 class="font-display text-[18px] text-ink">Keyword opportunities</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">Search volume is illustrative · use the connected provider for live data.</p>
					</div>
					<span class="chip !text-[9px]">{book.research.keywords.length} terms</span>
				</div>
				<div class="hidden grid-cols-[1fr_80px_80px_80px] gap-3 border-b border-line px-5 py-2 text-[8.5px] uppercase tracking-[0.08em] text-faint sm:grid">
					<span>Keyword</span><span>Volume</span><span>Difficulty</span><span>Opportunity</span>
				</div>
				{#each book.research.keywords as k}
					<div class="table-row grid gap-2 px-5 py-2.5 sm:grid-cols-[1fr_80px_80px_80px] sm:items-center">
						<div class="flex items-center gap-2">
							<span class="text-[11px] text-ink">{k.keyword}</span>
							<span class="chip !px-1.5 !py-0 !text-[7.5px] capitalize">{k.intent}</span>
						</div>
						<span class="mono text-[10px] text-muted">{k.volume.toLocaleString()}</span>
						<span class="flex items-center gap-1.5"><span class="mono text-[10px] text-muted">{k.difficulty}</span><span class="h-1 w-8 overflow-hidden rounded-full bg-white/10"><span class="block h-full bg-rose" style="width:{k.difficulty}%"></span></span></span>
						<span class="flex items-center gap-1.5"><span class="mono text-[10px] text-teal">{k.opportunity}</span><span class="h-1 w-8 overflow-hidden rounded-full bg-white/10"><span class="block h-full bg-teal" style="width:{k.opportunity}%"></span></span></span>
					</div>
				{/each}
			</div>

			<!-- comps -->
			<div class="card overflow-hidden">
				<div class="border-b border-line px-5 py-3.5">
					<h2 class="font-display text-[18px] text-ink">Comparable titles</h2>
					<p class="mt-0.5 text-[10.5px] text-faint">The shelf your cover will sit on.</p>
				</div>
				{#each book.research.comps as c}
					<div class="border-b border-line px-5 py-3 last:border-0">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-[11.5px] text-ink">{c.title} <span class="text-faint">— {c.author}</span></p>
								<p class="mt-0.5 text-[9.5px] leading-relaxed text-muted">{c.angle}</p>
							</div>
							<div class="shrink-0 text-right">
								<p class="mono text-[11px] text-ink">${c.price.toFixed(2)}</p>
								<p class="text-[9px] text-faint">★ {c.rating} · {c.reviews.toLocaleString()}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="space-y-5">
			<div class="card p-5">
				<p class="eyebrow">Price band</p>
				<div class="mt-2 flex items-baseline gap-2">
					<span class="font-display text-[38px] text-ink">${book.research.suggestedPrice.toFixed(2)}</span>
					<span class="text-[11px] text-faint">recommended ebook</span>
				</div>
				<div class="mt-3 flex items-center gap-2 text-[10px] text-faint">
					<span>Low ${book.research.priceMin.toFixed(2)}</span>
					<span class="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><span class="block h-full w-2/3 bg-gradient-to-r from-gold-deep to-gold"></span></span>
					<span>High ${book.research.priceMax.toFixed(2)}</span>
				</div>
				<p class="mt-3 text-[10.5px] leading-relaxed text-muted">{book.research.audienceInsight}</p>
			</div>

			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Channel fit</h3>
				<div class="mt-3 space-y-2.5">
					{#each book.research.channels as ch}
						<div>
							<div class="flex justify-between text-[10px]"><span class="text-muted">{ch.name}</span><span class="mono text-faint">{ch.fit}</span></div>
							<Progress value={ch.fit} height={3} tone={ch.fit > 80 ? 'teal' : 'gold'} />
							<p class="mt-1 text-[9px] leading-relaxed text-faint">{ch.note}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Production cost estimate</h3>
				<p class="mt-1 text-[10px] text-faint">At current provider rates. Actual cost is tracked per run.</p>
				<div class="mt-3 space-y-1.5">
					{#each book.research.costEstimate as c}
						<div class="flex justify-between text-[10.5px]"><span class="text-muted">{c.label}</span><span class="mono text-ink">${c.value.toFixed(2)}</span></div>
					{/each}
				</div>
				<div class="mt-3 flex justify-between border-t border-line pt-3 text-[11px]"><span class="text-faint">Estimated total</span><span class="mono text-gold">${totalCost.toFixed(2)}</span></div>
			</div>

			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Launch checklist</h3>
				<div class="mt-3 space-y-2">
					{#each [['Keyword map applied', true], ['Cover category tested', true], ['ARC list prepared', false], ['Series page linked', !!book.series], ['Audiobook scoped', false]] as [label, done]}
						<div class="flex items-center gap-2 text-[10px]">
							<span class="flex h-4 w-4 items-center justify-center rounded {done ? 'bg-teal/15 text-teal' : 'border border-line text-faint'}">{#if done}<Icon name="check" size={9} />{/if}</span>
							<span class={done ? 'text-muted' : 'text-faint'}>{label}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
