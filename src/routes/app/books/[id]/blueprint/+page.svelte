<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { startPipeline } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import Avatar from '$lib/components/Avatar.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));
const approved = $derived(book ? ['outline', 'drafting', 'editing', 'design', 'export', 'published'].includes(book.stage) : false);

function save() {
	if (book) studio.updateBook(book.id, {});
}

function approve() {
	if (!book) return;
	studio.updateBook(book.id, { stage: book.stage === 'concept' ? 'outline' : 'outline' });
	studio.addActivity({ kind: 'edit', title: 'Blueprint approved', detail: `${book.title} · canon lock v1.0`, bookId: book.id });
	studio.notify('Blueprint approved — manuscript is cleared for drafting');
}

function regenerate() {
	if (!book) return;
	startPipeline(book.id, 'blueprint', { speed: 1.5 });
	studio.notify('Blueprint rerun started');
}
</script>

	<svelte:head><title>Blueprint — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Blueprint" title="The book before the book." description="This is the contract every specialist works from: promise, audience, character system, world rules, style guide and canon locks. Approve it once; change it deliberately.">
		<button class="btn btn-secondary" onclick={regenerate}><Icon name="refresh" size={14} /> Rerun blueprint</button>
		{#if !approved}
			<button class="btn btn-primary" onclick={approve}><Icon name="check" size={14} /> Approve blueprint</button>
		{:else}
			<span class="chip chip-success"><Icon name="check-circle" size={12} /> Approved · canon locked</span>
		{/if}
	</PageHeader>

	<div class="grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
		<div class="space-y-5">
			<!-- concept -->
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<h2 class="font-display text-[20px] text-ink">Concept & positioning</h2>
					<span class="chip !text-[9px]">Editable</span>
				</div>
				<div class="mt-4 grid gap-4">
					<div class="grid gap-4 sm:grid-cols-[1.6fr_.9fr]">
						<div>
							<label class="label" for="t">Title</label>
							<input id="t" class="input" bind:value={book.title} onchange={save} />
						</div>
						<div>
							<label class="label" for="g">Genre</label>
							<input id="g" class="input" bind:value={book.genre} onchange={save} />
						</div>
					</div>
					<div>
						<label class="label" for="sub">Subtitle</label>
						<input id="sub" class="input" bind:value={book.subtitle} onchange={save} />
					</div>
					<div>
						<label class="label" for="log">Logline</label>
						<textarea id="log" class="textarea" rows="2" bind:value={book.logline} onchange={save}></textarea>
					</div>
					<div>
						<label class="label" for="prem">Premise</label>
						<textarea id="prem" class="textarea" rows="5" bind:value={book.premise} onchange={save}></textarea>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="label" for="aud">Audience</label>
							<input id="aud" class="input" bind:value={book.audience} onchange={save} />
						</div>
						<div>
							<label class="label" for="target">Target words</label>
							<input id="target" class="input" type="number" bind:value={book.targetWords} step="1000" onchange={save} />
						</div>
					</div>
				</div>
			</div>

			<!-- themes -->
			<div class="card p-5">
				<h2 class="font-display text-[20px] text-ink">Themes, hooks & differentiators</h2>
				<div class="mt-4 grid gap-5 sm:grid-cols-2">
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Themes</p>
						<ul class="mt-2 space-y-1.5">
							{#each book.themes as t}<li class="flex items-start gap-2 text-[11.5px] text-muted"><span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold"></span>{t}</li>{/each}
						</ul>
					</div>
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Reader hooks</p>
						<ul class="mt-2 space-y-1.5">
							{#each book.hooks as t}<li class="flex items-start gap-2 text-[11.5px] text-muted"><span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal"></span>{t}</li>{/each}
						</ul>
					</div>
				</div>
				<div class="mt-4 border-t border-line pt-4">
					<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Unique selling points</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each book.usps as u}<span class="chip chip-gold !text-[9.5px]">{u}</span>{/each}
					</div>
				</div>
			</div>

			<!-- characters -->
			<div class="card overflow-hidden">
				<div class="flex items-center justify-between border-b border-line px-5 py-3.5">
					<div>
						<h2 class="font-display text-[18px] text-ink">Character system</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">Want / need / wound / arc. Tier-one characters receive 62% of page oxygen.</p>
					</div>
					<span class="chip !text-[9px]">{book.bible.characters.length} characters</span>
				</div>
				<div class="divide-y divide-line">
					{#each book.bible.characters as c}
						<div class="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
							<div class="flex w-[190px] shrink-0 items-center gap-2.5">
								<Avatar name={c.name} hue={38} size={28} />
								<div>
									<p class="text-[11.5px] text-ink">{c.name}</p>
									<p class="text-[9px] capitalize text-faint">{c.role} · tier {c.tier}</p>
								</div>
							</div>
							<div class="grid flex-1 gap-1 text-[10.5px] sm:grid-cols-2">
								<p class="text-muted"><span class="text-faint">Want:</span> {c.want}</p>
								<p class="text-muted"><span class="text-faint">Need:</span> {c.need}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- style -->
			<div class="card p-5">
				<h2 class="font-display text-[20px] text-ink">Style guide</h2>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					{#each [['POV', book.bible.styleGuide.pov], ['Tense', book.bible.styleGuide.tense], ['Narrative distance', book.bible.styleGuide.distance], ['Dialogue', book.bible.styleGuide.dialogue]] as [k, v]}
						<div class="rounded-lg border border-line bg-white/[0.02] p-3">
							<p class="text-[9px] uppercase tracking-[0.1em] text-faint">{k}</p>
							<p class="mt-1 text-[11px] leading-relaxed text-muted">{v}</p>
						</div>
					{/each}
				</div>
				<div class="mt-3 rounded-lg border border-rose/15 bg-rose/[0.04] p-3">
					<p class="text-[9px] uppercase tracking-[0.1em] text-rose">Avoid</p>
					<p class="mt-1 text-[11px] leading-relaxed text-muted">{book.bible.styleGuide.avoid}</p>
				</div>
			</div>
		</div>

		<!-- right -->
		<div class="space-y-5">
			<div class="card p-5">
				<p class="eyebrow">Canon locks</p>
				<p class="mt-1 text-[11px] leading-relaxed text-muted">Invariants the continuity auditor enforces. Locked rules require a deliberate revision to change.</p>
				<div class="mt-4 space-y-2.5">
					{#each book.bible.canon as rule}
						<div class="rounded-lg border border-line bg-white/[0.02] p-2.5">
							<div class="flex items-center justify-between">
								<span class="text-[8.5px] uppercase tracking-[0.1em] text-faint">{rule.scope}</span>
								<span class="chip !px-1.5 !py-0 !text-[8px] {rule.status === 'locked' ? 'chip-gold' : ''}">{rule.status}</span>
							</div>
							<p class="mt-1 text-[10.5px] leading-relaxed text-muted">{rule.rule}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<p class="eyebrow">Voice anchor</p>
				<p class="mt-2 rounded-lg border border-line bg-canvas/50 p-3 font-display text-[12.5px] leading-relaxed text-ink/90">“{book.config.styleAnchor}”</p>
				<div class="mt-3 flex items-center justify-between text-[10px] text-faint">
					<span>Model</span><span class="mono text-muted">{book.config.model}</span>
				</div>
				<div class="mt-1.5 flex items-center justify-between text-[10px] text-faint">
					<span>Temperature</span><span class="mono text-muted">{book.config.temperature}</span>
				</div>
				<div class="mt-1.5 flex items-center justify-between text-[10px] text-faint">
					<span>Autonomy</span><span class="capitalize text-muted">{book.config.autonomy}</span>
				</div>
			</div>

			{#if !approved}
				<div class="card border-gold/25 bg-gold/[0.05] p-5">
					<p class="flex items-center gap-2 text-[12px] font-medium text-gold"><Icon name="shield" size={15} /> Human approval gate</p>
					<p class="mt-2 text-[11px] leading-relaxed text-muted">Drafting is blocked until the blueprint is approved. This protects the canon from drift before a single chapter is written.</p>
					<button class="btn btn-primary mt-4 w-full" onclick={approve}><Icon name="check" size={14} /> Approve blueprint</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
