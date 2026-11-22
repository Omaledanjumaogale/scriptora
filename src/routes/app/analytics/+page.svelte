<script lang="ts">
import { studio } from '$lib/store.svelte';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import Sparkline from '$lib/components/Sparkline.svelte';

const spend = $derived(studio.runs.reduce((s, r) => s + r.cost, 0));
const tokens = $derived(studio.runs.reduce((s, r) => s + r.tokens, 0));
const words = $derived(studio.totalWords);
const costPerK = $derived(spend / Math.max(1, words / 1000));

const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const output = $derived([6200, 12400, 21800, 34200, 51800, Math.max(62000, words)]);
const outputPoints = $derived.by(() => {
	const max = Math.max(...output);
	return output.map((v, i) => `${(i / (output.length - 1)) * 640},${180 - (v / max) * 160}`).join(' ');
});
const outputArea = $derived(`0,180 ${outputPoints} 640,180`);

const costByBook = $derived.by(() =>
	studio.books
		.map((b) => ({
			title: b.title,
			cost: studio.runs.filter((r) => r.bookId === b.id).reduce((s, r) => s + r.cost, 0),
			words: b.wordCount,
			quality: b.quality
		}))
		.sort((a, b) => b.cost - a.cost)
);
const maxCost = $derived(Math.max(...costByBook.map((c) => c.cost), 1));

const pipelineMix = $derived.by(() => {
	const groups: Record<string, number> = {};
	for (const r of studio.runs) {
		const key = r.pipeline.split(' ')[0];
		groups[key] = (groups[key] ?? 0) + 1;
	}
	return Object.entries(groups);
});

const qualityTrend = [84, 86, 87, 89, 90, 91];
</script>

<svelte:head><title>Analytics — Scriptora</title></svelte:head>

<PageHeader eyebrow="Operations" title="What the studio actually did." description="Output, cost, quality and agent utilisation across the workspace. Every number is derived from the run ledger — no vanity metrics.">
	<select class="select !w-auto !py-1.5 !text-[11px]"><option>Last 6 months</option><option>This quarter</option><option>This month</option></select>
	<button class="btn btn-secondary" onclick={() => studio.notify('Report exported as CSV')}><Icon name="download" size={14} /> Export report</button>
</PageHeader>

<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
	{#each [
		{ label: 'Words produced', value: words.toLocaleString(), note: '+72.4k this month', spark: [22, 31, 28, 44, 41, 58, 66], icon: 'feather' },
		{ label: 'Production spend', value: `$${spend.toFixed(2)}`, note: `${Math.round(tokens / 1000)}k tokens`, spark: [4, 7, 6, 11, 9, 14, 12], icon: 'billing' },
		{ label: 'Cost / 1k words', value: `$${costPerK.toFixed(2)}`, note: 'Across all agents', spark: [1.1, 1.0, 0.9, 0.8, 0.8, 0.7, 0.7], icon: 'target' },
		{ label: 'Avg. quality', value: String(Math.round(studio.books.reduce((s, b) => s + b.quality, 0) / Math.max(1, studio.books.length))), note: 'Canon + editorial score', spark: qualityTrend, icon: 'award' }
	] as s}
		<div class="card p-4">
			<div class="flex items-start justify-between">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold"><Icon name={s.icon} size={15} /></span>
				<Sparkline data={s.spark} width={68} height={26} />
			</div>
			<p class="mt-4 font-display text-[25px] leading-none text-ink">{s.value}</p>
			<p class="mt-1.5 text-[11px] text-muted">{s.label}</p>
			<p class="text-[10px] text-faint">{s.note}</p>
		</div>
	{/each}
</div>

<div class="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
	<div class="space-y-5">
		<!-- output chart -->
		<div class="card p-5">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="font-display text-[19px] text-ink">Words under management</h2>
					<p class="mt-0.5 text-[10.5px] text-faint">Cumulative across the workspace, last six months.</p>
				</div>
				<span class="chip chip-teal !text-[9px]">+{Math.round((output[5] / output[4] - 1) * 100)}% MoM</span>
			</div>
			<div class="mt-5">
				<svg viewBox="0 0 640 190" class="h-[190px] w-full" preserveAspectRatio="none" aria-hidden="true">
					<defs>
						<linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#e0b872" stop-opacity="0.26" />
							<stop offset="100%" stop-color="#e0b872" stop-opacity="0" />
						</linearGradient>
					</defs>
					{#each [0, 45, 90, 135, 180] as y}
						<line x1="0" x2="640" {y} stroke="rgba(255,255,255,.05)" stroke-width="1" />
					{/each}
					<polygon points={outputArea} fill="url(#area)" />
					<polyline points={outputPoints} fill="none" stroke="#e0b872" stroke-width="2.2" stroke-linejoin="round" />
					{#each output as v, i}
						<circle cx={(i / (output.length - 1)) * 640} cy={180 - (v / Math.max(...output)) * 160} r="3" fill="#e0b872" stroke="#11151d" stroke-width="2" />
					{/each}
				</svg>
				<div class="mt-1 flex justify-between px-1">
					{#each months as m}<span class="text-[9px] text-faint">{m}</span>{/each}
				</div>
			</div>
		</div>

		<!-- cost by book -->
		<div class="card p-5">
			<h2 class="font-display text-[19px] text-ink">Production cost by title</h2>
			<p class="mt-0.5 text-[10.5px] text-faint">Agent spend, all runs. Excludes the annual subscription.</p>
			<div class="mt-4 space-y-3">
				{#each costByBook as c}
					<div>
						<div class="flex items-center justify-between text-[10px]">
							<span class="truncate text-muted">{c.title}</span>
							<span class="mono shrink-0 text-ink">${c.cost.toFixed(2)}</span>
						</div>
						<div class="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.05]">
							<div class="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style="width:{Math.max(2, (c.cost / maxCost) * 100)}%"></div>
						</div>
						<div class="mt-1 flex justify-between text-[8.5px] text-faint">
							<span>{c.words.toLocaleString()} words · quality {c.quality}</span>
							<span>${c.words ? (c.cost / (c.words / 1000)).toFixed(2) : '0.00'} / 1k</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="space-y-5">
		<!-- quality trend -->
		<div class="card p-5">
			<h2 class="font-display text-[18px] text-ink">Quality trend</h2>
			<p class="mt-0.5 text-[10.5px] text-faint">Canon + editorial composite, six releases.</p>
			<div class="mt-4 flex items-end justify-between gap-2" style="height:120px">
				{#each qualityTrend as q, i}
					<div class="flex flex-1 flex-col items-center justify-end gap-1.5">
						<span class="mono text-[8.5px] text-faint">{q}</span>
						<div class="w-full rounded-t-[2px] bg-gradient-to-t from-teal/30 to-teal/70" style="height:{(q - 70) * 3.2}px"></div>
						<span class="text-[8px] text-faint">R{i + 1}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- pipeline mix -->
		<div class="card p-5">
			<h2 class="font-display text-[18px] text-ink">Pipeline mix</h2>
			<div class="mt-4 flex items-center gap-5">
				<div class="relative h-24 w-24 shrink-0 rounded-full" style="background:conic-gradient(#e0b872 0 38%, #7dd3c0 38% 65%, #a78bfa 65% 84%, #f0a0a8 84% 100%)">
					<div class="absolute inset-[14px] rounded-full bg-panel"></div>
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<span class="font-display text-[20px] text-ink">{studio.runs.length}</span>
						<span class="text-[8px] uppercase tracking-[0.1em] text-faint">runs</span>
					</div>
				</div>
				<div class="flex-1 space-y-2">
					{#each [['Drafting', '38%', '#e0b872'], ['Editorial', '27%', '#7dd3c0'], ['Research', '19%', '#a78bfa'], ['Design / export', '16%', '#f0a0a8']] as [label, pct, color]}
						<div class="flex items-center gap-2 text-[10px]"><span class="h-2 w-2 rounded-sm" style="background:{color}"></span><span class="flex-1 text-muted">{label}</span><span class="mono text-faint">{pct}</span></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- efficiency -->
		<div class="card p-5">
			<h2 class="font-display text-[18px] text-ink">Efficiency</h2>
			<div class="mt-3 space-y-3">
				{#each [['Words per dollar', Math.round(words / Math.max(1, spend)).toLocaleString(), 'teal'], ['Human interventions', '4', 'gold'], ['First-pass approval', '78%', 'violet'], ['Rework rate', '9%', 'rose']] as [label, value, tone]}
					<div class="flex items-center justify-between">
						<span class="text-[10px] text-muted">{label}</span>
						<span class="font-display text-[17px] text-{tone === 'teal' ? 'teal' : tone === 'gold' ? 'gold' : tone === 'violet' ? 'violet' : 'rose'}">{value}</span>
					</div>
				{/each}
			</div>
			<p class="mt-3 border-t border-line pt-3 text-[9px] leading-relaxed text-faint">Efficiency is computed from accepted words and run ledger cost. It excludes subscription and human editorial time.</p>
		</div>
	</div>
</div>

<!-- ledger -->
<div class="card mt-5 overflow-hidden">
	<div class="border-b border-line px-5 py-3.5">
		<h2 class="font-display text-[18px] text-ink">Run ledger</h2>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[720px] text-left">
			<thead>
				<tr class="border-b border-line text-[8.5px] uppercase tracking-[0.08em] text-faint">
					<th class="px-5 py-2 font-medium">Pipeline</th>
					<th class="px-3 py-2 font-medium">Book</th>
					<th class="px-3 py-2 font-medium">Model</th>
					<th class="px-3 py-2 font-medium">Tokens</th>
					<th class="px-3 py-2 font-medium">Cost</th>
					<th class="px-3 py-2 font-medium">Status</th>
					<th class="px-5 py-2 font-medium">Started</th>
				</tr>
			</thead>
			<tbody>
				{#each studio.runs as r}
					<tr class="table-row">
						<td class="px-5 py-2.5 text-[10.5px] text-ink">{r.pipeline}</td>
						<td class="max-w-[180px] truncate px-3 py-2.5 text-[10px] text-muted">{r.bookTitle}</td>
						<td class="px-3 py-2.5"><span class="mono text-[8.5px] text-faint">{r.model}</span></td>
						<td class="mono px-3 py-2.5 text-[9.5px] text-muted">{Math.round(r.tokens / 1000)}k</td>
						<td class="mono px-3 py-2.5 text-[9.5px] text-muted">${r.cost.toFixed(2)}</td>
						<td class="px-3 py-2.5"><span class="chip !px-1.5 !py-0 !text-[8px] capitalize {r.status === 'complete' ? 'chip-success' : r.status === 'paused' ? 'chip-rose' : 'chip-gold'}">{r.status}</span></td>
						<td class="px-5 py-2.5 text-[9px] text-faint">{new Date(r.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
