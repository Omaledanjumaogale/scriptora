<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { resumeRun } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import PipelineLauncher from '$lib/components/PipelineLauncher.svelte';
import RunConsole from '$lib/components/RunConsole.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
const runs = $derived(studio.runs.filter((r) => r.bookId === id));
let selected = $state('');

const active = $derived(runs.find((r) => r.id === selected) ?? runs.find((r) => r.status === 'running' || r.status === 'paused') ?? runs[0]);
</script>

	<svelte:head><title>Runs — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Agent studio" title="Inspect every pass." description="Each pipeline is a sequence of narrow, auditable steps. Follow the live log, pause for human decisions, and route any specialist to a different model.">
		<span class="chip chip-teal"><span class="h-1.5 w-1.5 rounded-full bg-teal pulse-dot"></span> {studio.liveRuns.length} live</span>
		<span class="chip">${runs.reduce((s, r) => s + r.cost, 0).toFixed(2)} spent on this book</span>
	</PageHeader>

	<PipelineLauncher {book} />

	<div class="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="font-display text-[19px] text-ink">Run history</h2>
				<span class="text-[10px] text-faint">{runs.length} runs</span>
			</div>
			{#each runs as r}
				<button class="w-full text-left" onclick={() => (selected = r.id)}>
					<div class="transition {active?.id === r.id ? 'ring-1 ring-gold/30 rounded-2xl' : 'opacity-85 hover:opacity-100'}">
						<RunConsole run={r} onresume={resumeRun} />
					</div>
				</button>
			{/each}
			{#if !runs.length}
				<div class="card py-12 text-center">
					<Icon name="studio" size={26} class="mx-auto text-faint" />
					<p class="mt-2 font-display text-[17px] text-ink">No runs on this book yet.</p>
					<p class="mt-1 text-[10.5px] text-faint">Launch a pipeline above to see the steps and logs.</p>
				</div>
			{/if}
		</div>

		<div class="space-y-4">
			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Routing</h3>
				<div class="mt-3 space-y-3">
					<div>
						<label class="label !text-[9px]" for="model">Drafting model</label>
						<select id="model" class="select !py-1.5 !text-[11px]" bind:value={book.config.model} onchange={() => studio.updateBook(book.id, {})}>
							<option>studio-prose-1</option>
							<option>claude-sonnet-4-5</option>
							<option>gpt-5</option>
							<option>gemini-2.5-pro</option>
							<option>deepseek-chat</option>
						</select>
					</div>
					<div>
						<label class="label !text-[9px]" for="autonomy">Autonomy</label>
						<select id="autonomy" class="select !py-1.5 !text-[11px]" bind:value={book.config.autonomy} onchange={() => studio.updateBook(book.id, {})}>
							<option value="copilot">Copilot — suggest only</option>
							<option value="supervised">Supervised — pause at gates</option>
							<option value="autonomous">Autonomous — full pipeline</option>
						</select>
					</div>
					<div>
						<label class="label !text-[9px]" for="budget">Run budget cap</label>
						<div class="flex items-center gap-2">
							<span class="text-[11px] text-faint">$</span>
							<input id="budget" class="input !py-1.5 !text-[11px]" type="number" bind:value={book.config.budgetCap} onchange={() => studio.updateBook(book.id, {})} />
						</div>
					</div>
				</div>
			</div>

			<div class="card p-5">
				<h3 class="flex items-center gap-2 text-[12px] font-semibold text-ink"><Icon name="shield" size={14} class="text-gold" /> Human gates</h3>
				<div class="mt-3 space-y-2">
					{#each [['Blueprint approval', true], ['High-severity continuity', true], ['Cover selection', true], ['Publication release', true]] as [label, on]}
						<div class="flex items-center justify-between">
							<span class="text-[10px] text-muted">{label}</span>
							<span class="flex h-4 w-7 items-center rounded-full p-0.5 {on ? 'bg-gold/80' : 'bg-white/10'}"><span class="h-3 w-3 rounded-full bg-canvas"></span></span>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-[9px] leading-relaxed text-faint">Gates cannot be disabled by an agent. An owner must approve each state change.</p>
			</div>

			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Canon snapshot</h3>
				<div class="mt-3 space-y-1.5 text-[10px]">
					<div class="flex justify-between"><span class="text-faint">Characters</span><span class="mono text-muted">{book.bible.characters.length}</span></div>
					<div class="flex justify-between"><span class="text-faint">World entries</span><span class="mono text-muted">{book.bible.world.length}</span></div>
					<div class="flex justify-between"><span class="text-faint">Canon locks</span><span class="mono text-muted">{book.bible.canon.filter((c) => c.status === 'locked').length}</span></div>
					<div class="flex justify-between"><span class="text-faint">Invariants checked</span><span class="mono text-muted">18</span></div>
				</div>
				<p class="mt-3 rounded-md border border-line bg-canvas/40 p-2 font-mono text-[8.5px] text-faint">canon://{book.id}/v3.4 · locked</p>
			</div>
		</div>
	</div>
{/if}
