<script lang="ts">
import { studio } from '$lib/store.svelte';
import Icon from '$lib/components/Icon.svelte';
import Modal from '$lib/components/Modal.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const agents = [
	{ id: 'orchestrator', name: 'Orchestrator', icon: 'git-merge', role: 'Routes work and maintains pipeline state.', model: 'studio-architect-1', status: 'ready', tools: ['job queue', 'canon reader', 'budget meter'], permissions: ['read:canon', 'write:runs'], gate: 'Budget cap + human gates', recent: '31 jobs routed' },
	{ id: 'research', name: 'Research', icon: 'search', role: 'Collects approved sources and builds the project retrieval index.', model: 'studio-research-1', status: 'ready', tools: ['web search', 'document index', 'citation store'], permissions: ['read:web', 'write:research'], gate: 'Source allow-list', recent: '12 sources indexed' },
	{ id: 'concept', name: 'Concept', icon: 'lightbulb', role: 'Turns a brief into promise, logline, themes, hooks and USPs.', model: 'studio-architect-1', status: 'ready', tools: ['brief parser', 'market signal'], permissions: ['read:brief', 'write:concept'], gate: 'Blueprint approval', recent: '3 concepts this month' },
	{ id: 'outliner', name: 'Outliner', icon: 'list', role: 'Designs parts, chapters and scenes with dramatic purpose.', model: 'studio-architect-1', status: 'ready', tools: ['structure templates', 'craft protocols'], permissions: ['read:concept', 'write:outline'], gate: 'Blueprint approval', recent: '36 scenes mapped' },
	{ id: 'character', name: 'Character', icon: 'users', role: 'Builds want / need / wound / arc and voice fingerprints.', model: 'studio-architect-1', status: 'ready', tools: ['bible writer', 'voice sampler'], permissions: ['read:concept', 'write:bible'], gate: 'Canon lock', recent: '6 characters' },
	{ id: 'world', name: 'Worldbuilder', icon: 'globe', role: 'Maintains places, factions, rules, glossary and timeline.', model: 'studio-architect-1', status: 'ready', tools: ['bible writer', 'timeline'], permissions: ['read:concept', 'write:bible'], gate: 'Canon lock', recent: '6 entries' },
	{ id: 'writer', name: 'Chapter Writer', icon: 'feather', role: 'Drafts complete chapters with a re-applied voice anchor.', model: 'studio-prose-1', status: 'running', tools: ['canon digest', 'style anchor', 'scene plan'], permissions: ['read:canon', 'write:chapters'], gate: 'Editorial approval', recent: '9 chapters drafted' },
	{ id: 'editor', name: 'Editor', icon: 'pen', role: 'Line edits for clarity, rhythm and voice; applies AI-ism sweep.', model: 'studio-editor-1', status: 'ready', tools: ['prose protocols', 'diff writer'], permissions: ['read:chapters', 'write:suggestions'], gate: 'Chapter approval', recent: '412 suggestions' },
	{ id: 'continuity', name: 'Continuity Auditor', icon: 'shield', role: 'Checks every claim against canon and the narrative graph.', model: 'studio-editor-1', status: 'paused', tools: ['narrative graph', 'invariant checker'], permissions: ['read:all', 'write:findings'], gate: 'High-severity human decision', recent: '3 findings' },
	{ id: 'pacing', name: 'Pacing Analyst', icon: 'chart', role: 'Models tension, chapter length and the reader’s emotional curve.', model: 'studio-editor-1', status: 'ready', tools: ['pacing model', 'scene ledger'], permissions: ['read:chapters', 'write:report'], gate: 'Report only', recent: '12-chapter curve' },
	{ id: 'factcheck', name: 'Fact Checker', icon: 'check-circle', role: 'Verifies nonfiction claims and flags unsupported assertions.', model: 'studio-research-1', status: 'ready', tools: ['source index', 'claim extractor'], permissions: ['read:chapters', 'read:sources'], gate: 'Citation required', recent: '2 claims flagged' },
	{ id: 'designer', name: 'Cover Designer', icon: 'palette', role: 'Builds cover directions, typography and back-cover copy.', model: 'studio-design-1', status: 'ready', tools: ['palette system', 'motif renderer'], permissions: ['read:concept', 'write:cover'], gate: 'Owner selects direction', recent: 'Midnight / rings' },
	{ id: 'producer', name: 'Production', icon: 'download', role: 'Assembles front/back matter, EPUB, PDF and validation.', model: 'studio-format-1', status: 'ready', tools: ['EPUB builder', 'print engine', 'validator'], permissions: ['read:all', 'write:exports'], gate: 'Publication release', recent: '0 errors' }
];

let selected = $state<(typeof agents)[number] | null>(null);

const matrix = [
	['Concept', 'canon', 'concept', '—', '—', 'Blueprint gate'],
	['Outliner', 'canon', 'outline', '—', '—', 'Blueprint gate'],
	['Character / World', 'canon', 'bible', '—', '—', 'Canon lock'],
	['Chapter Writer', 'canon', 'chapters', 'suggestions', '—', 'Editorial gate'],
	['Editor', 'chapters', 'suggestions', 'chapters', '—', 'Chapter approval'],
	['Continuity', 'all', 'findings', '—', '—', 'Human decision'],
	['Cover Designer', 'concept', 'cover', '—', '—', 'Owner selection'],
	['Production', 'all', 'exports', '—', 'export', 'Publication release']
];
</script>

<svelte:head><title>Specialists — Scriptora</title></svelte:head>

<PageHeader eyebrow="Agent roster" title="Twelve narrow specialists." description="No generalist god-agent. Each specialist has one job, a defined input and output, an explicit permission boundary and a human approval gate where it matters.">
	<button class="btn btn-secondary" onclick={() => studio.notify('Permission matrix exported to audit log')}><Icon name="download" size={14} /> Export matrix</button>
	<button class="btn btn-primary" onclick={() => studio.notify('Agent health check complete — 12/12 responding')}><Icon name="shield" size={14} /> Run health check</button>
</PageHeader>

<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
	{#each agents as agent}
		<button class="card card-hover flex flex-col p-4 text-left" onclick={() => (selected = agent)}>
			<div class="flex items-start justify-between">
				<span class="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold"><Icon name={agent.icon} size={16} /></span>
				<span class="flex items-center gap-1.5 text-[9px] capitalize {agent.status === 'running' ? 'text-gold' : agent.status === 'paused' ? 'text-warning' : 'text-teal'}">
					<span class="h-1.5 w-1.5 rounded-full {agent.status === 'running' ? 'bg-gold pulse-dot' : agent.status === 'paused' ? 'bg-warning' : 'bg-teal'}"></span>{agent.status}
				</span>
			</div>
			<h3 class="mt-3 text-[13px] font-semibold text-ink">{agent.name}</h3>
			<p class="mt-1 flex-1 text-[10.5px] leading-relaxed text-muted">{agent.role}</p>
			<div class="mt-3 flex items-center justify-between border-t border-line pt-2.5">
				<span class="mono text-[8.5px] text-faint">{agent.model}</span>
				<span class="text-[9px] text-faint">{agent.recent}</span>
			</div>
		</button>
	{/each}
</div>

<div class="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
	<div class="card overflow-hidden">
		<div class="border-b border-line px-5 py-3.5">
			<h2 class="font-display text-[18px] text-ink">Permission matrix</h2>
			<p class="mt-0.5 text-[10.5px] text-faint">Least privilege by default. Agents propose; humans dispose.</p>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[620px] text-left">
				<thead>
					<tr class="border-b border-line text-[8.5px] uppercase tracking-[0.08em] text-faint">
						<th class="px-5 py-2 font-medium">Agent</th>
						<th class="px-2 py-2 font-medium">Read</th>
						<th class="px-2 py-2 font-medium">Draft</th>
						<th class="px-2 py-2 font-medium">Write</th>
						<th class="px-2 py-2 font-medium">Publish</th>
						<th class="px-4 py-2 font-medium">Gate</th>
					</tr>
				</thead>
				<tbody>
					{#each matrix as row}
						<tr class="border-b border-line last:border-0">
							<td class="px-5 py-2.5 text-[10.5px] text-ink">{row[0]}</td>
							<td class="px-2 py-2.5"><span class="chip !px-1.5 !py-0 !text-[8px]">{row[1]}</span></td>
							<td class="px-2 py-2.5"><span class="chip !px-1.5 !py-0 !text-[8px]">{row[2]}</span></td>
							<td class="px-2 py-2.5"><span class="chip !px-1.5 !py-0 !text-[8px] {row[3] === '—' ? '' : 'chip-teal'}">{row[3]}</span></td>
							<td class="px-2 py-2.5"><span class="chip !px-1.5 !py-0 !text-[8px] {row[4] === '—' ? '' : 'chip-rose'}">{row[4]}</span></td>
							<td class="px-4 py-2.5 text-[9px] text-faint">{row[5]}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="space-y-4">
		<div class="card p-5">
			<h3 class="font-display text-[17px] text-ink">Orchestration</h3>
			<div class="mt-3 space-y-1.5">
				{#each [['Orchestrator', 'routes work, enforces budget'], ['Research + Concept', 'ground the promise'], ['Architecture', 'outline, character, world'], ['Drafting', 'chapter writer, scene circuits'], ['Quality', 'editor, continuity, pacing'], ['Production', 'cover, front matter, export']] as [stage, detail], i}
					<div class="flex items-center gap-2.5 rounded-md border border-line bg-white/[0.02] px-2.5 py-2">
						<span class="flex h-5 w-5 items-center justify-center rounded-full border border-gold/20 font-mono text-[8px] text-gold">{i + 1}</span>
						<div class="min-w-0 flex-1">
							<p class="text-[10px] text-ink">{stage}</p>
							<p class="truncate text-[8.5px] text-faint">{detail}</p>
						</div>
						{#if i < 5}<Icon name="arrow-down" size={10} class="text-faint" />{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">Runtime</h3>
			<div class="mt-3 space-y-2 text-[10px]">
				<div class="flex justify-between"><span class="text-faint">Active specialists</span><span class="text-muted">12</span></div>
				<div class="flex justify-between"><span class="text-faint">Total runs</span><span class="mono text-muted">{studio.runs.length}</span></div>
				<div class="flex justify-between"><span class="text-faint">Tokens this month</span><span class="mono text-muted">{Math.round(studio.runs.reduce((s, r) => s + r.tokens, 0) / 1000)}k</span></div>
				<div class="flex justify-between"><span class="text-faint">Spend</span><span class="mono text-muted">${studio.runs.reduce((s, r) => s + r.cost, 0).toFixed(2)}</span></div>
			</div>
		</div>
	</div>
</div>

<Modal open={Boolean(selected)} title={selected?.name ?? ''} subtitle={selected?.role} width="580px" onclose={() => (selected = null)}>
	{#if selected}
		<div class="space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] text-gold"><Icon name={selected.icon} size={20} /></span>
				<div>
					<p class="mono text-[11px] text-muted">{selected.model}</p>
					<p class="text-[10px] capitalize text-faint">{selected.status} · {selected.recent}</p>
				</div>
				<span class="chip chip-teal ml-auto">Agent {selected.id}</span>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg border border-line bg-white/[0.02] p-3">
					<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Approved tools</p>
					<div class="mt-2 flex flex-wrap gap-1.5">{#each selected.tools as t}<span class="chip !text-[8.5px]">{t}</span>{/each}</div>
				</div>
				<div class="rounded-lg border border-line bg-white/[0.02] p-3">
					<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Permissions</p>
					<div class="mt-2 flex flex-wrap gap-1.5">{#each selected.permissions as p}<span class="chip chip-teal !text-[8.5px]">{p}</span>{/each}</div>
				</div>
			</div>
			<div class="rounded-lg border border-warning/20 bg-warning/[0.05] p-3">
				<p class="text-[9px] uppercase tracking-[0.1em] text-warning">Human approval required</p>
				<p class="mt-1 text-[11px] leading-relaxed text-muted">{selected.gate}</p>
			</div>
			<div class="rounded-lg border border-line bg-canvas/40 p-3">
				<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Prohibited</p>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">Publishing, deleting project data, changing canon locks, altering its own permissions, or exceeding the run budget.</p>
			</div>
			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => studio.notify('Agent prompt exported for review')}>View prompt</button>
				<button class="btn btn-primary" onclick={() => { studio.notify('Test invocation queued'); selected = null; }}>Test invoke</button>
			</div>
		</div>
	{/if}
</Modal>
