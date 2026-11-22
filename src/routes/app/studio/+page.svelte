<script lang="ts">
import { studio } from '$lib/store.svelte';
import { goto } from '$app/navigation';
import { startPipeline, resumeRun } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import RunConsole from '$lib/components/RunConsole.svelte';

let brief = $state('');
let genre = $state('Literary Fiction');
let audience = $state('Upmarket book-club readers');
let targetWords = $state(72000);
let chapters = $state(12);
let launching = $state(false);

const genres = ['Literary Fiction', 'Nonfiction', 'Business', 'Memoir', 'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Self-help', 'Essays'];

const examples = [
	'A novel about a municipal archivist who finds a map of a district that was demolished nine years ago — and a second record that proves the official account is false.',
	'A practical operating system for teams that make things: how attention, decisions and handoffs compound into either leverage or waste.',
	'A memoir about growing up between two languages, told through the objects that survived three moves and one fire.'
];

const active = $derived(studio.runs.filter((r) => r.status === 'running' || r.status === 'paused' || r.status === 'queued'));
const history = $derived(studio.runs.filter((r) => r.status === 'complete' || r.status === 'failed'));

function launch() {
	if (!brief.trim()) {
		studio.notify('Describe the book first — one or two sentences is enough.', 'error');
		return;
	}
	launching = true;
	setTimeout(() => {
		const book = studio.newBook({
			title: '',
			genre,
			audience,
			description: brief.trim(),
			author: studio.user?.name ?? 'Amara Venn',
			targetWords,
			chapters
		});
		startPipeline(book.id, 'full-book', { speed: 2.1 });
		launching = false;
		studio.notify('Full-book pipeline started');
		goto(`/app/books/${book.id}/studio`);
	}, 500);
}
</script>

<svelte:head><title>Agent Studio — Scriptora</title></svelte:head>

<PageHeader eyebrow="Agent studio" title="Describe it. Watch it become a book." description="The studio turns a brief into a blueprint, a blueprint into a manuscript, and a manuscript into a validated export — with every step inspectable and every gate yours.">
	<span class="chip chip-teal"><span class="h-1.5 w-1.5 rounded-full bg-teal pulse-dot"></span> Studio engine online</span>
	<button class="btn btn-secondary" onclick={() => goto('/app/agents')}><Icon name="agents" size={14} /> Specialist roster</button>
</PageHeader>

<div class="grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
	<div class="space-y-5">
		<!-- intake -->
		<div class="card relative overflow-hidden p-5 sm:p-6">
			<div class="pointer-events-none absolute right-0 top-0 h-[220px] w-[260px] rounded-full bg-gold/[0.05] blur-[80px]"></div>
			<div class="relative">
				<div class="flex items-center gap-2.5">
					<span class="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold"><Icon name="sparkles" size={15} /></span>
					<div>
						<h2 class="font-display text-[20px] text-ink">Idea intake</h2>
						<p class="text-[10.5px] text-faint">One brief is enough. The studio proposes the rest.</p>
					</div>
					<span class="chip chip-gold ml-auto !text-[9px]">Full production</span>
				</div>
				<textarea
					class="textarea mt-4 min-h-[120px] !text-[13px] !leading-relaxed"
					bind:value={brief}
					placeholder="A novel about… / A practical book about… / A memoir about…"
				></textarea>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each examples as e, i}
						<button class="chip !text-[9px] hover:border-line-strong" onclick={() => (brief = e)}>Example {i + 1}</button>
					{/each}
				</div>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<div>
						<label class="label !text-[9px]" for="genre">Genre</label>
						<select id="genre" class="select !py-2 !text-[11px]" bind:value={genre}>{#each genres as g}<option>{g}</option>{/each}</select>
					</div>
					<div>
						<label class="label !text-[9px]" for="audience">Audience</label>
						<input id="audience" class="input !py-2 !text-[11px]" bind:value={audience} />
					</div>
					<div>
						<label class="label !text-[9px]" for="tw">Target words</label>
						<input id="tw" class="input !py-2 !text-[11px]" type="number" step="1000" bind:value={targetWords} />
					</div>
					<div>
						<label class="label !text-[9px]" for="ch">Chapters</label>
						<input id="ch" class="input !py-2 !text-[11px]" type="number" min="3" max="40" bind:value={chapters} />
					</div>
				</div>
				<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
					<div class="flex flex-wrap gap-1.5">
						{#each ['Story bible', 'Scene circuits', 'Continuity audit', 'Cover', 'EPUB'] as tag}<span class="chip !text-[8.5px]">{tag}</span>{/each}
					</div>
					<button class="btn btn-primary" onclick={launch} disabled={launching}>
						{#if launching}<Icon name="loader" size={14} class="animate-spin" /> Preparing studio…{:else}<Icon name="zap" size={14} /> Generate complete book{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- active -->
		<div>
			<div class="mb-2.5 flex items-center justify-between">
				<h2 class="font-display text-[19px] text-ink">Live runs</h2>
				<span class="text-[10px] text-faint">{active.length} active</span>
			</div>
			<div class="space-y-3">
				{#each active as run}
					<RunConsole {run} onresume={resumeRun} />
				{/each}
				{#if !active.length}
					<div class="card py-10 text-center">
						<Icon name="studio" size={24} class="mx-auto text-faint" />
						<p class="mt-2 text-[12px] text-ink">The studio is idle.</p>
						<p class="mt-0.5 text-[10px] text-faint">Start a pipeline above, or open a book and run the next stage.</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- history -->
		<div class="card overflow-hidden">
			<div class="border-b border-line px-4 py-3">
				<h2 class="font-display text-[18px] text-ink">Completed runs</h2>
			</div>
			{#each history as run}
				<div class="table-row flex flex-wrap items-center gap-3 px-4 py-2.5">
					<Icon name={run.status === 'failed' ? 'alert-triangle' : 'check-circle'} size={13} class={run.status === 'failed' ? 'text-danger' : 'text-teal'} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-[10.5px] text-ink">{run.pipeline}</p>
						<p class="truncate text-[9px] text-faint">{run.bookTitle}</p>
					</div>
					<span class="mono text-[9px] text-faint">{Math.round(run.tokens / 1000)}k</span>
					<span class="mono text-[9px] text-faint">${run.cost.toFixed(2)}</span>
					<button class="text-[9px] text-gold hover:underline" onclick={() => goto(`/app/books/${run.bookId}/studio`)}>Open</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- rail -->
	<div class="space-y-4">
		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">Studio configuration</h3>
			<div class="mt-3 space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-[10px] text-faint">Default model</span>
					<span class="chip !text-[8.5px]">studio-prose-1</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] text-faint">Autonomy</span>
					<span class="chip chip-gold !text-[8.5px]">Supervised</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] text-faint">Budget cap / run</span>
					<span class="mono text-[10px] text-muted">$120.00</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-[10px] text-faint">Human gates</span>
					<span class="chip chip-teal !text-[8.5px]">4 active</span>
				</div>
			</div>
			<button class="btn btn-secondary btn-sm mt-4 w-full" onclick={() => goto('/app/settings')}>Manage routing</button>
		</div>

		<div class="card p-5">
			<div class="flex items-center justify-between">
				<h3 class="text-[12px] font-semibold text-ink">Specialists</h3>
				<button class="text-[10px] text-gold hover:underline" onclick={() => goto('/app/agents')}>All</button>
			</div>
			<div class="mt-3 space-y-2">
				{#each [['Concept Generator', 'ready'], ['Outliner', 'ready'], ['Chapter Writer', 'running'], ['Continuity Auditor', 'queued'], ['Cover Designer', 'ready']] as [name, state]}
					<div class="flex items-center gap-2 text-[10px]">
						<span class="h-1.5 w-1.5 rounded-full {state === 'running' ? 'bg-gold pulse-dot' : state === 'queued' ? 'bg-violet' : 'bg-teal'}"></span>
						<span class="flex-1 text-muted">{name}</span>
						<span class="text-[8.5px] capitalize text-faint">{state}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">This month</h3>
			<div class="mt-3 grid grid-cols-2 gap-3">
				{#each [['Books', '3'], ['Words', '72.4k'], ['Runs', String(studio.runs.length)], ['Spend', `$${studio.runs.reduce((s, r) => s + r.cost, 0).toFixed(2)}`]] as [k, v]}
					<div class="rounded-lg border border-line bg-white/[0.02] p-2.5">
						<p class="text-[8.5px] uppercase tracking-[0.1em] text-faint">{k}</p>
						<p class="mt-0.5 font-display text-[17px] text-ink">{v}</p>
					</div>
				{/each}
			</div>
			<div class="mt-3">
				<div class="flex justify-between text-[9px] text-faint"><span>AI credits</span><span class="mono">61 / 100</span></div>
				<div class="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div class="h-full w-[61%] rounded-full bg-gold"></div></div>
			</div>
		</div>

		<div class="card border-line p-5">
			<h3 class="flex items-center gap-2 text-[12px] font-semibold text-ink"><Icon name="shield" size={14} class="text-teal" /> Guardrails</h3>
			<ul class="mt-3 space-y-2 text-[9.5px] leading-relaxed text-muted">
				<li class="flex gap-2"><Icon name="check" size={11} class="mt-0.5 shrink-0 text-teal" /> No agent can publish without owner approval.</li>
				<li class="flex gap-2"><Icon name="check" size={11} class="mt-0.5 shrink-0 text-teal" /> Budget caps stop runs at the configured limit.</li>
				<li class="flex gap-2"><Icon name="check" size={11} class="mt-0.5 shrink-0 text-teal" /> Manuscripts are never used for provider training.</li>
				<li class="flex gap-2"><Icon name="check" size={11} class="mt-0.5 shrink-0 text-teal" /> Every mutation is attributed in the audit trail.</li>
			</ul>
		</div>
	</div>
</div>
