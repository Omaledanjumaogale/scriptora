<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import { countWords } from '$lib/engine';
import { mdToHtml } from '$lib/export';
import Icon from '$lib/components/Icon.svelte';
import Progress from '$lib/components/Progress.svelte';

const bookId = $derived(page.params.id ?? '');
const chapterId = $derived(page.params.chapterId ?? '');
const book = $derived(studio.books.find((b) => b.id === bookId));
const chapter = $derived(book?.chapters.find((c) => c.id === chapterId));
const index = $derived(book && chapter ? book.chapters.findIndex((c) => c.id === chapter.id) : -1);

let content = $state('');
let loaded = $state('');
let mode = $state<'write' | 'preview' | 'split'>('split');
let saving = $state<'saved' | 'saving' | 'idle'>('idle');
let timer: ReturnType<typeof setTimeout> | undefined;
let suggestions = $state<{ before: string; after: string; reason: string }[]>([]);
let showNotes = $state(false);

$effect(() => {
	if (chapter && chapter.id !== loaded) {
		content = chapter.content;
		loaded = chapter.id;
		suggestions = [];
		saving = 'saved';
	}
});

const words = $derived(countWords(content));
const readingTime = $derived(Math.max(1, Math.round(words / 230)));

function onInput() {
	if (!book || !chapter) return;
	saving = 'saving';
	clearTimeout(timer);
	timer = setTimeout(() => {
		studio.saveChapter(book.id, chapter.id, content);
		saving = 'saved';
	}, 700);
}

function saveNow() {
	if (!book || !chapter) return;
	clearTimeout(timer);
	studio.saveChapter(book.id, chapter.id, content);
	saving = 'saved';
	studio.notify('Chapter saved');
}

function draft() {
	if (!book || !chapter) return;
	studio.draftChapter(book.id, chapter.id);
	content = book.chapters.find((c) => c.id === chapter.id)?.content ?? content;
	loaded = chapter.id;
	saving = 'saved';
	studio.notify(`Chapter ${chapter.number} drafted`);
}

function approve() {
	if (!book || !chapter) return;
	saveNow();
	studio.approveChapter(book.id, chapter.id);
	studio.addActivity({ kind: 'edit', title: `Chapter ${chapter.number} approved`, detail: `${chapter.title} · ${words.toLocaleString()} words`, bookId: book.id });
	studio.notify('Chapter approved and locked');
}

function scan() {
	suggestions = [];
	const checks: { re: RegExp; reason: string; replacement: (m: string) => string }[] = [
		{ re: /\bvery\s+(\w+)/i, reason: 'Filter word weakens the adjective.', replacement: () => '' },
		{ re: /\breally\s+(\w+)/i, reason: 'Filter word adds no information.', replacement: () => '' },
		{ re: /\b(?:in order )?to be able to\b/i, reason: 'Wordy construction.', replacement: () => 'can' },
		{ re: /\bthe fact that\b/i, reason: 'Nominalization buries the verb.', replacement: () => 'that' },
		{ re: /\bbegan to\s+(\w+)/i, reason: '“Began to” delays the action. Use the verb.', replacement: () => '' },
		{ re: /\bthat that\b/i, reason: 'Repeated conjunction.', replacement: () => 'that' },
		{ re: /\bseemed to\s+(\w+)/i, reason: 'Hedging verb; commit to the observation.', replacement: () => '' },
		{ re: /\b(?:a|an) (?:small|short|brief) (\w+)/i, reason: 'Stacked modifiers often signal AI cadence.', replacement: (m) => m.replace(/(?:a|an) (?:small|short|brief) /i, 'a ') }
	];
	for (const check of checks) {
		const m = content.match(check.re);
		if (m?.[0]) {
			const before = m[0];
			const after = check.replacement(before).trim();
			suggestions.push({ before, after: after || before.split(/\s+/).slice(1).join(' '), reason: check.reason });
		}
	}
	if (!suggestions.length) {
		suggestions = [{ before: 'No structural flags in this pass.', after: '', reason: 'Voice integrity looks clean. Run the full editorial agent for line-level suggestions.' }];
	}
	studio.notify(`${suggestions.filter((s) => s.after).length} suggestions found`, 'info');
}

function applySuggestion(s: { before: string; after: string }) {
	if (!s.after) return;
	content = content.replace(s.before, s.after);
	suggestions = suggestions.filter((x) => x !== s);
	onInput();
}

const prev = $derived(book && index > 0 ? book.chapters[index - 1] : null);
const next = $derived(book && index >= 0 && index < book.chapters.length - 1 ? book.chapters[index + 1] : null);
</script>

<svelte:head><title>Ch {chapter?.number ?? ''}: {chapter?.title ?? 'Chapter'} — {book?.title ?? 'Scriptora'}</title></svelte:head>

{#if book && chapter}

	<!-- editor toolbar -->
	<div class="mb-4 flex flex-wrap items-center gap-2">
		<button class="btn btn-ghost btn-sm" onclick={() => { saveNow(); goto(`/app/books/${book.id}/chapters`); }}><Icon name="arrow-left" size={13} /> Chapters</button>
		<div class="hidden items-center gap-1 sm:flex">
			<button class="btn btn-ghost btn-sm !px-2" disabled={!prev} onclick={() => { saveNow(); goto(`/app/books/${book.id}/chapters/${prev?.id}`); }}><Icon name="chevron-left" size={14} /></button>
			<button class="btn btn-ghost btn-sm !px-2" disabled={!next} onclick={() => { saveNow(); goto(`/app/books/${book.id}/chapters/${next?.id}`); }}><Icon name="chevron-right" size={14} /></button>
		</div>
		<span class="text-[11px] text-faint">Chapter {chapter.number} of {book.chapters.length}</span>
		<span class="ml-auto flex items-center gap-1 text-[10px] {saving === 'saving' ? 'text-gold' : 'text-faint'}">
			{#if saving === 'saving'}<Icon name="loader" size={11} class="animate-spin" /> Saving…{:else}<Icon name="check" size={11} /> Saved locally{/if}
		</span>
		<button class="btn btn-secondary btn-sm" onclick={scan}><Icon name="search" size={12} /> Scan prose</button>
		<button class="btn btn-secondary btn-sm" onclick={draft}><Icon name="sparkles" size={12} /> Draft with AI</button>
		<button class="btn btn-primary btn-sm" onclick={approve}><Icon name="check" size={12} /> Approve</button>
	</div>

	<div class="grid gap-5 xl:grid-cols-[1fr_310px]">
		<div class="min-w-0">
			<!-- chapter meta -->
			<div class="card mb-3 p-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<input
							class="w-full bg-transparent font-display text-[24px] leading-tight text-ink outline-none placeholder:text-faint"
							bind:value={chapter.title}
							onchange={() => studio.updateBook(book.id, {})}
							aria-label="Chapter title"
						/>
						<p class="mt-1 text-[10.5px] text-faint">{chapter.part} · POV {chapter.pov} · {chapter.scenes.length} scenes</p>
					</div>
					<div class="flex gap-1 rounded-lg border border-line bg-canvas/40 p-0.5">
						{#each [['write', 'Write'], ['split', 'Split'], ['preview', 'Read']] as [m, l]}
							<button class="rounded-md px-2.5 py-1 text-[10px] transition {mode === m ? 'bg-panel-3 text-ink' : 'text-faint hover:text-muted'}" onclick={() => (mode = m as typeof mode)}>{l}</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="grid gap-3 {mode === 'split' ? 'lg:grid-cols-2' : ''}">
				{#if mode === 'write' || mode === 'split'}
					<div class="card flex min-h-[520px] flex-col p-4">
						<div class="mb-2 flex items-center justify-between">
							<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Manuscript · Markdown</p>
							<p class="text-[9px] text-faint">{words.toLocaleString()} words · {readingTime} min read</p>
						</div>
						<textarea
							class="min-h-[460px] w-full flex-1 resize-none bg-transparent font-mono text-[12px] leading-[1.9] text-ink/90 outline-none placeholder:text-faint"
							spellcheck="true"
							bind:value={content}
							oninput={onInput}
							placeholder="Begin the chapter. Or use “Draft with AI” to generate a first pass from the blueprint and scene plan."
						></textarea>
					</div>
				{/if}
				{#if mode === 'preview' || mode === 'split'}
					<div class="card min-h-[520px] overflow-hidden p-5 sm:p-7">
						<p class="mb-4 text-[9px] uppercase tracking-[0.12em] text-faint">Reader view · {book.trimSize}</p>
						<div class="prose-manuscript max-w-[640px]">
							{#if content.trim()}
								{@html mdToHtml(content)}
							{:else}
								<p class="!font-sans text-[12px] !text-faint">This chapter has no prose yet. Draft it or start writing.</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- suggestions -->
			{#if suggestions.length}
				<div class="card mt-3 p-4">
					<div class="flex items-center justify-between">
						<p class="text-[11px] font-semibold text-ink">Editorial suggestions</p>
						<button class="text-[10px] text-faint hover:text-ink" onclick={() => (suggestions = [])}>Dismiss</button>
					</div>
					<div class="mt-2 space-y-2">
						{#each suggestions as s}
							<div class="flex items-start gap-3 rounded-lg border border-line bg-white/[0.02] p-2.5">
								<Icon name="sparkles" size={13} class="mt-0.5 shrink-0 text-gold" />
								<div class="min-w-0 flex-1">
									<p class="text-[10.5px] text-ink"><span class="rounded bg-rose/10 px-1 text-rose">{s.before}</span>{#if s.after} → <span class="rounded bg-teal/10 px-1 text-teal">{s.after}</span>{/if}</p>
									<p class="mt-1 text-[9.5px] text-faint">{s.reason}</p>
								</div>
								{#if s.after}<button class="btn btn-secondary btn-sm" onclick={() => applySuggestion(s)}>Apply</button>{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- right rail -->
		<div class="space-y-3">
			<div class="card p-4">
				<div class="flex items-center justify-between">
					<p class="text-[11px] font-semibold text-ink">Chapter health</p>
					<span class="chip !text-[8.5px] capitalize">{chapter.status}</span>
				</div>
				<div class="mt-3">
					<div class="flex justify-between text-[9px] text-faint"><span>Length</span><span class="mono">{words.toLocaleString()} / {chapter.targetWords.toLocaleString()}</span></div>
					<Progress value={(words / chapter.targetWords) * 100} height={4} tone={words >= chapter.targetWords ? 'teal' : 'gold'} />
				</div>
				<div class="mt-3 grid grid-cols-2 gap-2 text-[9.5px]">
					<div class="rounded-md border border-line bg-white/[0.02] p-2"><p class="text-faint">Scenes</p><p class="mt-0.5 mono text-ink">{chapter.scenes.length}</p></div>
					<div class="rounded-md border border-line bg-white/[0.02] p-2"><p class="text-faint">Circuits</p><p class="mt-0.5 mono text-teal">{chapter.scenes.filter((s) => s.circuit?.take).length}/{chapter.scenes.length}</p></div>
				</div>
			</div>

			<div class="card p-4">
				<p class="text-[11px] font-semibold text-ink">Scene plan</p>
				<div class="mt-2.5 space-y-1.5">
					{#each chapter.scenes as s, i}
						<div class="rounded-md border border-line bg-white/[0.02] p-2.5">
							<div class="flex items-center gap-1.5">
								<span class="mono text-[8px] text-gold">{String(i + 1).padStart(2, '0')}</span>
								<p class="min-w-0 flex-1 truncate text-[10px] text-ink">{s.title}</p>
								<span class="h-1.5 w-1.5 rounded-full" class:bg-teal={s.status === 'drafted'} class:bg-line-strong={s.status === 'planned'}></span>
							</div>
							<p class="mt-1 text-[9px] leading-relaxed text-faint">{s.summary}</p>
							<div class="mt-1.5 flex flex-wrap gap-0.5">
								{#each [['you', 'Y'], ['need', 'N'], ['go', 'G'], ['search', 'S'], ['find', 'F'], ['take', 'T'], ['return', 'R'], ['change', 'C']] as [key, label]}
									<span class="flex h-3.5 w-3.5 items-center justify-center rounded-[2px] text-[7px] {s.circuit?.[key as keyof typeof s.circuit] ? 'bg-teal/20 text-teal' : 'bg-white/[0.04] text-faint'}">{label}</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="card p-4">
				<button class="flex w-full items-center justify-between" onclick={() => (showNotes = !showNotes)}>
					<p class="text-[11px] font-semibold text-ink">Continuity notes</p>
					<Icon name="chevron-down" size={13} class="text-faint transition-transform {showNotes ? 'rotate-180' : ''}" />
				</button>
				{#if showNotes}
					<div class="mt-2 space-y-2">
						{#each book.craft.continuity.slice(0, 3) as c}
							<div class="flex gap-2 text-[9.5px]">
								<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" class:bg-danger={c.severity === 'high'} class:bg-warning={c.severity === 'medium'} class:bg-faint={c.severity === 'low'}></span>
								<p class="leading-relaxed text-muted">{c.message}</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="card p-4">
				<p class="text-[11px] font-semibold text-ink">Version history</p>
				<div class="mt-2 space-y-2">
					{#each [['v4', 'Current draft', 'just now'], ['v3', 'Editorial pass', '2 days ago'], ['v2', 'First draft', '6 days ago']] as [v, label, when]}
						<div class="flex items-center gap-2 text-[9.5px]">
							<span class="mono text-[8px] text-faint">{v}</span>
							<span class="flex-1 text-muted">{label}</span>
							<span class="text-faint">{when}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
