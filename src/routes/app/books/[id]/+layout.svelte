<script lang="ts">
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import BookCover from '$lib/components/BookCover.svelte';
import Icon from '$lib/components/Icon.svelte';
import Progress from '$lib/components/Progress.svelte';
import { startPipeline } from '$lib/pipeline';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));

const tabs = [
	{ slug: '', label: 'Overview', icon: 'home' },
	{ slug: 'blueprint', label: 'Blueprint', icon: 'compass' },
	{ slug: 'outline', label: 'Outline', icon: 'list' },
	{ slug: 'chapters', label: 'Chapters', icon: 'book-open' },
	{ slug: 'bible', label: 'Story Bible', icon: 'brain' },
	{ slug: 'craft', label: 'Craft', icon: 'feather' },
	{ slug: 'research', label: 'Market', icon: 'target' },
	{ slug: 'cover', label: 'Cover', icon: 'palette' },
	{ slug: 'exports', label: 'Export', icon: 'download' },
	{ slug: 'studio', label: 'Runs', icon: 'studio' }
];

function href(slug: string) {
	return `/app/books/${id}${slug ? '/' + slug : ''}`;
}

const activeSlug = $derived(page.url.pathname.split(`/app/books/${id}`)[1]?.replace(/^\//, '').split('/')[0] ?? '');

function runNext() {
	if (!book) return;
	const kind =
		book.stage === 'concept' || book.stage === 'blueprint'
			? 'blueprint'
			: book.stage === 'outline'
				? 'full-book'
				: book.stage === 'drafting'
					? 'editorial'
					: book.stage === 'design'
						? 'export'
						: 'editorial';
	startPipeline(book.id, kind as 'blueprint' | 'full-book' | 'editorial' | 'export', { speed: 1.2 });
	studio.notify('Pipeline started — open Runs to follow live');
	goto(href('studio'));
}
</script>

{#if book}
	<div class="fade-in">
		<!-- book header -->
		<div class="mb-5">
			<button class="mb-4 flex items-center gap-1.5 text-[11px] text-faint transition hover:text-ink" onclick={() => goto('/app/library')}>
				<Icon name="arrow-left" size={13} /> Library
			</button>
			<div class="flex flex-col gap-5 sm:flex-row sm:items-start">
				<BookCover book={book} size="sm" class="mt-1 shrink-0" />
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="mb-1.5 flex flex-wrap items-center gap-2">
								<span class="chip chip-gold !text-[9px] capitalize">{book.stage}</span>
								<span class="chip !text-[9px] capitalize">{book.status}</span>
								{#if book.series}<span class="chip !text-[9px]">{book.series} · Vol. {book.volume}</span>{/if}
							</div>
							<h1 class="font-display text-[27px] leading-tight text-ink sm:text-[32px]">{book.title}</h1>
							<p class="mt-1 text-[12px] text-muted">{book.subtitle}</p>
							<p class="mt-1.5 text-[10.5px] text-faint">by {book.author} · {book.genre} · {book.chapters.length} chapters · {book.trimSize}</p>
						</div>
						<div class="flex shrink-0 flex-wrap gap-2">
							<button class="btn btn-secondary" onclick={() => goto(href('exports'))}><Icon name="download" size={14} /> Export</button>
							<button class="btn btn-primary" onclick={runNext}><Icon name="sparkles" size={14} /> Run next stage</button>
						</div>
					</div>
					<div class="mt-4 grid max-w-[620px] grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
						<div>
							<div class="flex items-center justify-between text-[9px] uppercase tracking-[0.1em] text-faint"><span>Progress</span><span class="mono">{book.progress}%</span></div>
							<Progress value={book.progress} height={4} />
						</div>
						<div>
							<div class="flex items-center justify-between text-[9px] uppercase tracking-[0.1em] text-faint"><span>Draft</span><span class="mono">{Math.round((book.wordCount / book.targetWords) * 100)}%</span></div>
							<Progress value={(book.wordCount / book.targetWords) * 100} tone="teal" height={4} />
						</div>
						<div class="text-[10px] text-faint">
							<span class="mono text-[13px] text-ink">{book.wordCount.toLocaleString()}</span> / {book.targetWords.toLocaleString()} words
						</div>
						<div class="text-[10px] text-faint">
							Quality <span class="mono text-[13px] text-teal">{book.quality}</span> · <span class="text-ink">{book.chapters.filter((c) => c.content).length}</span>/{book.chapters.length} drafted
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- tabs -->
		<div class="scrollbar-none -mx-4 mb-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
			<nav class="flex min-w-max items-center gap-0.5">
				{#each tabs as t}
					<a
						href={href(t.slug)}
						class="relative flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-3 text-[11.5px] transition {activeSlug === t.slug ? 'text-gold' : 'text-muted hover:text-ink'}"
					>
						<Icon name={t.icon} size={13} />
						{t.label}
						{#if activeSlug === t.slug}<span class="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gold"></span>{/if}
					</a>
				{/each}
			</nav>
		</div>

		{@render children()}
	</div>
{:else}
	<div class="card py-20 text-center">
		<h2 class="font-display text-[22px] text-ink">That book is not in this workspace.</h2>
		<p class="mt-1.5 text-[12px] text-muted">It may have been archived or the link is incomplete.</p>
		<button class="btn btn-primary mt-5" onclick={() => goto('/app/library')}>Back to library</button>
	</div>
{/if}
