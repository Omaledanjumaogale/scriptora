<script lang="ts">
import { studio } from '$lib/store.svelte';
import { goto } from '$app/navigation';
import { STAGES } from '$lib/engine';
import BookCover from '$lib/components/BookCover.svelte';
import Progress from '$lib/components/Progress.svelte';
import Donut from '$lib/components/Donut.svelte';
import Icon from '$lib/components/Icon.svelte';
import Avatar from '$lib/components/Avatar.svelte';
import Sparkline from '$lib/components/Sparkline.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const flagship = $derived(studio.books.find((b) => b.id === 'book-cartographer') ?? studio.books[0]);
const active = $derived(studio.books.filter((b) => b.status === 'active'));
const live = $derived(studio.liveRuns);
const nextStage = $derived(flagship ? STAGES.find((s) => s.key === flagship.stage) : undefined);

const stats = $derived([
	{ label: 'Books in production', value: String(active.length), note: `${studio.books.length} total in library`, icon: 'book', spark: [2, 3, 2, 4, 3, 5, 4] },
	{ label: 'Words under management', value: studio.totalWords.toLocaleString(), note: '+12,480 this week', icon: 'feather', spark: [28, 32, 30, 41, 38, 47, 52] },
	{ label: 'Agent runs', value: String(studio.runs.length), note: `${live.length} live · ${studio.runs.filter((r) => r.status === 'paused').length} awaiting review`, icon: 'studio', spark: [1, 2, 2, 3, 4, 3, 5] },
	{ label: 'Avg. quality', value: String(Math.round(studio.books.reduce((s, b) => s + b.quality, 0) / Math.max(1, studio.books.length))), note: 'Canon + editorial score', icon: 'target', spark: [82, 84, 86, 85, 88, 90, 91] }
]);

const recent = $derived(studio.books.filter((b) => b.id !== flagship?.id).slice(0, 3));

function stageIndex(stage: string) {
	return STAGES.findIndex((s) => s.key === stage);
}
</script>

<svelte:head><title>Overview — Scriptora</title></svelte:head>

<div class="fade-in">
	<PageHeader
		eyebrow={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${studio.state.workspace.name}`}
		title="Good morning, {studio.user?.name?.split(' ')[0] ?? 'Author'}."
		description="One book is in editing, one is drafting, and a series blueprint is waiting for approval. The studio is quiet — for now."
	>
		<button class="btn btn-secondary" onclick={() => goto('/app/studio')}><Icon name="studio" size={14} /> Agent Studio</button>
		<button class="btn btn-primary" onclick={() => goto('/app/library?new=1')}><Icon name="plus" size={14} /> New book</button>
	</PageHeader>

	<!-- stat row -->
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each stats as s}
			<div class="card card-hover p-4">
				<div class="flex items-start justify-between">
					<span class="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold"><Icon name={s.icon} size={15} /></span>
					<Sparkline data={s.spark} width={64} height={26} />
				</div>
				<p class="mt-4 font-display text-[26px] leading-none text-ink">{s.value}</p>
				<p class="mt-1.5 text-[11px] text-muted">{s.label}</p>
				<p class="mt-0.5 text-[10px] text-faint">{s.note}</p>
			</div>
		{/each}
	</div>

	<div class="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
		<!-- continue card -->
		{#if flagship}
			<div class="card relative overflow-hidden">
				<div class="pointer-events-none absolute right-0 top-0 h-[240px] w-[300px] rounded-full bg-gold/[0.05] blur-[80px]"></div>
				<div class="relative p-6">
					<div class="flex items-center justify-between">
						<p class="eyebrow">Continue where you left off</p>
						<span class="chip chip-gold">{flagship.stage}</span>
					</div>
					<div class="mt-5 flex flex-col gap-6 sm:flex-row">
						<BookCover book={flagship} size="md" class="shadow-2xl" />
						<div class="min-w-0 flex-1">
							<h2 class="font-display text-[26px] leading-tight text-ink">{flagship.title}</h2>
							<p class="mt-1 text-[11.5px] text-faint">{flagship.subtitle}</p>
							<div class="mt-4 grid grid-cols-3 gap-3">
								<div>
									<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Draft</p>
									<p class="mono mt-1 text-[13px] text-ink">{flagship.wordCount.toLocaleString()}<span class="text-faint"> / {flagship.targetWords.toLocaleString()}</span></p>
								</div>
								<div>
									<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Chapters</p>
									<p class="mono mt-1 text-[13px] text-ink">{flagship.chapters.filter((c) => c.content).length}<span class="text-faint"> / {flagship.chapters.length}</span></p>
								</div>
								<div>
									<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Quality</p>
									<p class="mono mt-1 text-[13px] text-teal">{flagship.quality}<span class="text-faint"> / 100</span></p>
								</div>
							</div>
							<div class="mt-4">
								<Progress value={flagship.progress} showLabel />
							</div>
							<div class="mt-4 flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/[0.06] px-3 py-2.5">
								<Icon name="alert-triangle" size={14} class="shrink-0 text-warning" />
								<p class="text-[10.5px] leading-snug text-warning/90">1 high-severity continuity finding in Ch 9 needs your decision.</p>
							</div>
							<div class="mt-5 flex flex-wrap gap-2">
								<button class="btn btn-primary" onclick={() => goto(`/app/books/${flagship.id}`)}>Open book <Icon name="arrow-right" size={14} /></button>
								<button class="btn btn-secondary" onclick={() => goto(`/app/books/${flagship.id}/chapters`)}>Review chapters</button>
							</div>
						</div>
					</div>

					<!-- stage tracker -->
					<div class="mt-7 border-t border-line pt-5">
						<div class="flex items-center justify-between">
							<p class="text-[10px] uppercase tracking-[0.12em] text-faint">Production stage</p>
							<p class="text-[10px] text-muted">{nextStage?.label} — {nextStage?.hint}</p>
						</div>
						<div class="mt-3 flex items-center">
							{#each STAGES as s, i}
								{@const done = i < stageIndex(flagship.stage)}
								{@const current = i === stageIndex(flagship.stage)}
								<div class="flex flex-1 items-center last:flex-none">
									<div class="flex flex-col items-center gap-1.5">
										<span class="flex h-6 w-6 items-center justify-center rounded-full border text-[9px] {done ? 'border-teal/40 bg-teal/15 text-teal' : current ? 'border-gold/60 bg-gold/15 text-gold' : 'border-line text-faint'}">
											{#if done}<Icon name="check" size={10} />{:else}{i + 1}{/if}
										</span>
										<span class="hidden text-[8.5px] uppercase tracking-[0.08em] {current ? 'text-gold' : done ? 'text-muted' : 'text-faint'} sm:block">{s.label}</span>
									</div>
									{#if i < STAGES.length - 1}
										<span class="mx-1 mb-4 h-px flex-1 {done ? 'bg-teal/35' : 'bg-line'}"></span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- right column -->
		<div class="space-y-5">
			<!-- queue -->
			<div class="card">
				<div class="flex items-center justify-between border-b border-line px-4 py-3">
					<h3 class="text-[12px] font-semibold text-ink">Studio queue</h3>
					<button class="text-[10.5px] text-gold hover:underline" onclick={() => goto('/app/studio')}>View all</button>
				</div>
				<div>
					{#each studio.runs.slice(0, 3) as run}
						<button class="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-white/[0.02]" onclick={() => goto('/app/studio')}>
							<span class="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md {run.status === 'complete' ? 'bg-teal/10 text-teal' : run.status === 'paused' ? 'bg-warning/10 text-warning' : 'bg-gold/10 text-gold'}">
								<Icon name={run.status === 'complete' ? 'check-circle' : run.status === 'paused' ? 'pause' : 'loader'} size={13} class={run.status === 'running' ? 'animate-spin' : ''} />
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-[11.5px] text-ink">{run.pipeline}</span>
								<span class="mt-0.5 block truncate text-[10px] text-faint">{run.bookTitle}</span>
								{#if run.status === 'running'}
									<Progress value={run.progress} height={3} class="mt-2" />
								{/if}
							</span>
							<span class="shrink-0 text-[9.5px] capitalize {run.status === 'paused' ? 'text-warning' : run.status === 'complete' ? 'text-teal' : 'text-gold'}">{run.status}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- activity -->
			<div class="card">
				<div class="flex items-center justify-between border-b border-line px-4 py-3">
					<h3 class="text-[12px] font-semibold text-ink">Recent activity</h3>
					<span class="text-[10px] text-faint">Live</span>
				</div>
				<div class="px-4 py-2">
					{#each studio.activity.slice(0, 5) as item}
						<div class="flex gap-3 py-2.5">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/60"></span>
							<div class="min-w-0">
								<p class="truncate text-[11.5px] text-ink">{item.title}</p>
								<p class="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-faint">{item.detail}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- team -->
			<div class="card p-4">
				<div class="flex items-center justify-between">
					<h3 class="text-[12px] font-semibold text-ink">In the studio</h3>
					<button class="text-[10.5px] text-gold hover:underline" onclick={() => goto('/app/settings')}>Invite</button>
				</div>
				<div class="mt-3 flex items-center -space-x-2">
					<Avatar name="Amara Venn" initials="AV" hue={38} size={30} />
					<Avatar name="Nadia Okoro" initials="NO" hue={168} size={30} />
					<Avatar name="Jonah Hale" initials="JH" hue={262} size={30} />
					<span class="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line bg-panel-3 text-[9px] text-faint">+2</span>
				</div>
				<p class="mt-3 text-[10.5px] leading-relaxed text-faint">Nadia is editing Ch 9. Jonah is reviewing the cover package.</p>
			</div>
		</div>
	</div>

	<!-- books row -->
	<div class="mt-8">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-display text-[20px] text-ink">In production</h2>
			<button class="text-[11px] text-gold hover:underline" onclick={() => goto('/app/library')}>Open library</button>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each recent as book}
				<button class="card card-hover flex gap-4 p-4 text-left" onclick={() => goto(`/app/books/${book.id}`)}>
					<BookCover book={book} size="sm" />
					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between gap-2">
							<h3 class="font-display text-[15px] leading-snug text-ink">{book.title}</h3>
							<Icon name="chevron-right" size={14} class="mt-1 shrink-0 text-faint" />
						</div>
						<p class="mt-0.5 text-[10px] text-faint">{book.genre}</p>
						<div class="mt-3">
							<Progress value={book.progress} height={4} showLabel />
						</div>
						<div class="mt-2 flex items-center gap-3 text-[9.5px] text-faint">
							<span class="mono">{book.wordCount.toLocaleString()}w</span>
							<span>·</span>
							<span class="capitalize">{book.stage}</span>
						</div>
					</div>
				</button>
			{/each}
			<button class="card card-hover flex min-h-[140px] flex-col items-center justify-center gap-2 border-dashed p-5 text-center" onclick={() => goto('/app/library?new=1')}>
				<span class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-faint"><Icon name="plus" size={16} /></span>
				<span class="text-[12px] text-muted">Start a new book</span>
				<span class="text-[10px] text-faint">Brief → blueprint in one pass</span>
			</button>
		</div>
	</div>

	<!-- specialist strip -->
	<div class="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
		<div class="card p-5">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="font-display text-[18px] text-ink">Working specialists</h3>
					<p class="mt-0.5 text-[11px] text-muted">Every agent reads the same locked canon.</p>
				</div>
				<button class="btn btn-secondary btn-sm" onclick={() => goto('/app/agents')}>Roster <Icon name="arrow-right" size={12} /></button>
			</div>
			<div class="mt-4 grid gap-2 sm:grid-cols-2">
				{#each [['Drafting Agent', 'studio-prose-1', 'running', 'Ch 10 · The Quiet Part'], ['Continuity Auditor', 'studio-editor-1', 'done', '3 findings this pass'], ['Research Agent', 'studio-research-1', 'done', '12 sources indexed'], ['Cover Designer', 'studio-design-1', 'idle', 'Midnight / rings selected']] as [name, model, state, note]}
					<div class="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
						<span class="h-1.5 w-1.5 shrink-0 rounded-full {state === 'running' ? 'bg-gold pulse-dot' : state === 'done' ? 'bg-teal' : 'bg-faint'}"></span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[11.5px] text-ink">{name}</p>
							<p class="truncate text-[9.5px] text-faint">{note}</p>
						</div>
						<span class="mono hidden text-[8.5px] text-faint sm:block">{model}</span>
					</div>
				{/each}
			</div>
		</div>
		<div class="card flex items-center gap-5 p-5">
			<Donut value={flagship?.quality ?? 90} size={84} label="Quality" />
			<div>
				<h3 class="text-[12px] font-semibold text-ink">Editorial health</h3>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">Voice integrity, continuity and pacing across all active manuscripts.</p>
				<div class="mt-2 space-y-1 text-[10px]">
					<p class="flex justify-between"><span class="text-faint">Voice</span><span class="text-teal">94%</span></p>
					<p class="flex justify-between"><span class="text-faint">Continuity</span><span class="text-warning">3 open</span></p>
					<p class="flex justify-between"><span class="text-faint">Pacing</span><span class="text-ink">Balanced</span></p>
				</div>
			</div>
		</div>
	</div>
</div>
