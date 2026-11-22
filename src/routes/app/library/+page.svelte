<script lang="ts">
import { studio } from '$lib/store.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { onMount } from 'svelte';
import BookCover from '$lib/components/BookCover.svelte';
import Progress from '$lib/components/Progress.svelte';
import Icon from '$lib/components/Icon.svelte';
import Modal from '$lib/components/Modal.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import { startPipeline } from '$lib/pipeline';

let view = $state<'grid' | 'list'>('grid');
let query = $state('');
let status = $state('all');
let sort = $state('updated');
let newOpen = $state(false);
let creating = $state(false);

let title = $state('');
let genre = $state('Literary Fiction');
let audience = $state('Upmarket book-club readers');
let description = $state('');
let author = $state('Amara Venn');
let targetWords = $state(72000);
let chapters = $state(12);

onMount(() => {
	if (page.url.searchParams.get('new') === '1') newOpen = true;
});

const genres = ['Literary Fiction', 'Nonfiction', 'Business', 'Memoir', 'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Self-help', 'Essays', 'Poetry'];

const filtered = $derived(
	studio.books
		.filter((b) => (status === 'all' ? true : b.status === status))
		.filter((b) => !query || (b.title + b.author + b.genre + b.keywords.join(' ')).toLowerCase().includes(query.toLowerCase()))
		.sort((a, b) => {
			if (sort === 'title') return a.title.localeCompare(b.title);
			if (sort === 'words') return b.wordCount - a.wordCount;
			if (sort === 'progress') return b.progress - a.progress;
			return a.updatedAt < b.updatedAt ? 1 : -1;
		})
);

function createBook() {
	if (!title.trim()) {
		studio.notify('Give the book a working title first.', 'error');
		return;
	}
	creating = true;
	setTimeout(() => {
		const book = studio.newBook({
			title: title.trim(),
			genre,
			audience,
			description,
			author,
			targetWords,
			chapters
		});
		startPipeline(book.id, 'blueprint', { speed: 1.6 });
		creating = false;
		newOpen = false;
		studio.notify('Blueprint pipeline started');
		goto(`/app/books/${book.id}/blueprint`);
	}, 450);
}

function statusChip(s: string) {
	return s === 'all' ? '' : '';
}
</script>

<svelte:head><title>Library — Scriptora</title></svelte:head>

<div class="fade-in">
	<PageHeader eyebrow="Catalogue" title="Library" description={`${studio.books.length} books, ${studio.totalWords.toLocaleString()} words under management. Every project keeps its own canon, cover system and production record.`}>
		<button class="btn btn-secondary" onclick={() => (view = view === 'grid' ? 'list' : 'grid')}>
			<Icon name={view === 'grid' ? 'list' : 'grid'} size={14} /> {view === 'grid' ? 'List' : 'Grid'}
		</button>
		<button class="btn btn-primary" onclick={() => (newOpen = true)}><Icon name="plus" size={14} /> New book</button>
	</PageHeader>

	<div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
		<div class="relative flex-1">
			<Icon name="search" size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
			<input class="input pl-9" placeholder="Search titles, authors, genres, keywords…" bind:value={query} />
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#each [['all', 'All'], ['active', 'Active'], ['draft', 'Draft'], ['complete', 'Complete']] as [key, label]}
				<button class="chip transition {status === key ? 'chip-gold' : 'hover:border-line-strong'}" onclick={() => (status = key)}>{label}</button>
			{/each}
			<select class="select !w-auto !py-1.5 !text-[11px]" bind:value={sort}>
				<option value="updated">Recently updated</option>
				<option value="progress">Most progress</option>
				<option value="words">Longest</option>
				<option value="title">Title A–Z</option>
			</select>
		</div>
	</div>

	{#if view === 'grid'}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each filtered as book}
				<div class="card card-hover group relative overflow-hidden">
					<button class="w-full text-left" onclick={() => goto(`/app/books/${book.id}`)}>
						<div class="relative flex gap-4 p-4">
							<BookCover book={book} size="sm" />
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-1">
									<div class="min-w-0">
										<h3 class="truncate font-display text-[16px] leading-snug text-ink">{book.title}</h3>
										<p class="mt-0.5 truncate text-[10.5px] text-faint">{book.genre} · {book.series || 'Standalone'}</p>
									</div>
									<span class="chip !px-1.5 !py-0.5 !text-[8.5px] capitalize {book.status === 'complete' ? 'chip-success' : book.status === 'active' ? 'chip-teal' : ''}">{book.status}</span>
								</div>
								<p class="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{book.logline}</p>
								<div class="mt-3">
									<Progress value={book.progress} height={4} showLabel />
								</div>
							</div>
						</div>
						<div class="grid grid-cols-3 divide-x divide-line border-t border-line">
							<div class="px-3 py-2.5">
								<p class="text-[8.5px] uppercase tracking-[0.1em] text-faint">Words</p>
								<p class="mono mt-0.5 text-[11px] text-ink">{book.wordCount.toLocaleString()}</p>
							</div>
							<div class="px-3 py-2.5">
								<p class="text-[8.5px] uppercase tracking-[0.1em] text-faint">Chapters</p>
								<p class="mono mt-0.5 text-[11px] text-ink">{book.chapters.filter((c) => c.content).length}/{book.chapters.length}</p>
							</div>
							<div class="px-3 py-2.5">
								<p class="text-[8.5px] uppercase tracking-[0.1em] text-faint">Quality</p>
								<p class="mono mt-0.5 text-[11px] text-teal">{book.quality}</p>
							</div>
						</div>
					</button>
					<div class="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
						<button class="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-panel-2 text-muted hover:text-ink" title="Cover" onclick={() => goto(`/app/books/${book.id}/cover`)}><Icon name="palette" size={13} /></button>
						<button class="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-panel-2 text-muted hover:text-ink" title="Studio" onclick={() => goto(`/app/books/${book.id}/studio`)}><Icon name="studio" size={13} /></button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="hidden grid-cols-[1fr_120px_100px_100px_110px_40px] gap-4 border-b border-line px-4 py-2.5 text-[9px] uppercase tracking-[0.1em] text-faint md:grid">
				<span>Book</span><span>Stage</span><span>Words</span><span>Quality</span><span>Updated</span><span></span>
			</div>
			{#each filtered as book}
				<button class="table-row grid w-full grid-cols-[1fr_40px] items-center gap-4 px-4 py-3 text-left md:grid-cols-[1fr_120px_100px_100px_110px_40px]" onclick={() => goto(`/app/books/${book.id}`)}>
					<div class="flex min-w-0 items-center gap-3">
						<BookCover book={book} size="xs" />
						<div class="min-w-0">
							<p class="truncate text-[12.5px] text-ink">{book.title}</p>
							<p class="truncate text-[10px] text-faint">{book.author} · {book.genre}</p>
						</div>
					</div>
					<span class="hidden md:block"><span class="chip !text-[9px] capitalize">{book.stage}</span></span>
					<span class="mono hidden text-[11px] text-muted md:block">{book.wordCount.toLocaleString()}</span>
					<span class="mono hidden text-[11px] text-teal md:block">{book.quality}</span>
					<span class="hidden text-[10px] text-faint md:block">{new Date(book.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
					<Icon name="chevron-right" size={14} class="text-faint" />
				</button>
			{/each}
		</div>
	{/if}

	{#if !filtered.length}
		<div class="card py-16 text-center">
			<p class="font-display text-[18px] text-ink">No books match that search.</p>
			<p class="mt-1 text-[12px] text-muted">Try a different genre or clear the filters.</p>
			<button class="btn btn-secondary mt-4" onclick={() => { query = ''; status = 'all'; }}>Clear filters</button>
		</div>
	{/if}

	<div class="mt-6 flex items-center justify-between text-[10px] text-faint">
		<span>Showing {filtered.length} of {studio.books.length} projects</span>
		<span>Storage: local-first · Convex sync ready</span>
	</div>
</div>

<Modal open={newOpen} title="Start a new book" subtitle="The blueprint pipeline will build concept, story bible, characters and a full chapter plan." width="620px">
	<div class="space-y-4">
		<div>
			<label class="label" for="title">Working title</label>
			<input id="title" class="input" bind:value={title} placeholder="e.g. The Cartographer of Silence" />
			<p class="mt-1 text-[10px] text-faint">Leave blank and the studio will propose a title from the brief.</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="label" for="genre">Genre</label>
				<select id="genre" class="select" bind:value={genre}>{#each genres as g}<option>{g}</option>{/each}</select>
			</div>
			<div>
				<label class="label" for="audience">Audience</label>
				<input id="audience" class="input" bind:value={audience} />
			</div>
		</div>
		<div>
			<label class="label" for="desc">Brief</label>
			<textarea id="desc" class="textarea" rows="4" bind:value={description} placeholder="What is the book about? What should the reader feel or know by the end?"></textarea>
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<label class="label" for="author">Author byline</label>
				<input id="author" class="input" bind:value={author} />
			</div>
			<div>
				<label class="label" for="words">Target words</label>
				<input id="words" class="input" type="number" bind:value={targetWords} step="1000" />
			</div>
			<div>
				<label class="label" for="chs">Chapters</label>
				<input id="chs" class="input" type="number" bind:value={chapters} min="3" max="40" />
			</div>
		</div>
		<div class="rounded-lg border border-line bg-white/[0.02] p-3">
			<p class="flex items-start gap-2 text-[10.5px] leading-relaxed text-muted"><Icon name="sparkles" size={13} class="mt-0.5 shrink-0 text-gold" /> The blueprint pass adds 6 characters, 6 world entries, canon locks, scene circuits and a market brief. You approve it before drafting.</p>
		</div>
	</div>
	{#snippet footer()}
		<button class="btn btn-ghost" onclick={() => (newOpen = false)}>Cancel</button>
		<button class="btn btn-primary" onclick={createBook} disabled={creating}>
			{#if creating}<Icon name="loader" size={14} class="animate-spin" /> Building blueprint…{:else}Create & build blueprint <Icon name="arrow-right" size={14} />{/if}
		</button>
	{/snippet}
</Modal>
