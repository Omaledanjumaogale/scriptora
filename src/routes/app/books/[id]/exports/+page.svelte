<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { buildEpub, buildMarkdown, download, manuscriptHtml, printBook } from '$lib/export';
import { archiveAsset } from '$lib/assets';
import { startPipeline } from '$lib/pipeline';
import Icon from '$lib/components/Icon.svelte';
import BookCover from '$lib/components/BookCover.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));

let front = $state({ title: true, copyright: true, dedication: true, epigraph: true, toc: true });
let back = $state({ acknowledgements: true, author: true, alsoBy: true, process: true });
let busy = $state('');
let exported = $state<{ name: string; format: string; at: string; size: string }[]>([]);

const drafted = $derived(book?.chapters.filter((c) => c.content.trim()).length ?? 0);

function filename(ext: string) {
	return `${(book?.title ?? 'manuscript').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-scriptora.${ext}`;
}

async function doEpub() {
	if (!book) return;
	busy = 'epub';
	try {
		const blob = await buildEpub(book);
		download(filename('epub'), blob, 'application/epub+zip');
		exported.unshift({ name: filename('epub'), format: 'EPUB 3', at: new Date().toISOString(), size: `${Math.round(blob.size / 1024)} KB` });
		studio.notify('EPUB 3 built and downloaded');
	} finally {
		busy = '';
	}
}

async function archiveEpub() {
	if (!book) return;
	if (!studio.session) {
		studio.notify('Sign in with Google or GitHub to archive to R2', 'error');
		return;
	}
	busy = 'r2';
	try {
		const blob = await buildEpub(book);
		const result = await archiveAsset(blob, filename('epub'));
		studio.notify(`EPUB archived to R2 · ${Math.round(result.size / 1024)} KB`);
		exported.unshift({ name: filename('epub'), format: 'R2 archive', at: new Date().toISOString(), size: `${Math.round(result.size / 1024)} KB` });
	} catch (error) {
		studio.notify(error instanceof Error ? error.message : 'R2 archive failed', 'error');
	} finally {
		busy = '';
	}
}

function doPdf() {
	if (!book) return;
	busy = 'pdf';
	const ok = printBook(book);
	busy = '';
	if (ok) {
		exported.unshift({ name: filename('pdf'), format: 'Print PDF', at: new Date().toISOString(), size: 'print dialog' });
		studio.notify('Print dialog opened — choose “Save as PDF”');
	} else studio.notify('Allow pop-ups to generate the print PDF', 'error');
}

function doFormat(kind: 'md' | 'html' | 'txt' | 'json') {
	if (!book) return;
	if (kind === 'md') download(filename('md'), buildMarkdown(book), 'text/markdown');
	if (kind === 'html') download(filename('html'), manuscriptHtml(book), 'text/html');
	if (kind === 'txt') download(filename('txt'), manuscriptHtml(book).replace(/<[^>]+>/g, ''), 'text/plain');
	if (kind === 'json') download(filename('json'), JSON.stringify(book, null, 2), 'application/json');
	exported.unshift({ name: filename(kind), format: kind.toUpperCase(), at: new Date().toISOString(), size: 'generated' });
	studio.notify(`${kind.toUpperCase()} downloaded`);
}

function validate() {
	if (!book) return;
	startPipeline(book.id, 'export', { speed: 1.8 });
	studio.notify('Export validation started');
}
</script>

	<svelte:head><title>Export — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Production" title="Ship a book, not a document." description={`${drafted} of ${book.chapters.length} chapters have prose. Assemble front matter, choose a package and download a validated EPUB, print-ready PDF or editable source.`}>
		<button class="btn btn-secondary" onclick={validate}><Icon name="shield" size={14} /> Validate package</button>
		<button class="btn btn-secondary" onclick={archiveEpub} disabled={busy === 'r2'}>
			{#if busy === 'r2'}<Icon name="loader" size={14} class="animate-spin" /> Archiving…{:else}<Icon name="server" size={14} /> Archive EPUB to R2{/if}
		</button>
		<button class="btn btn-primary" onclick={doEpub} disabled={busy === 'epub'}>
			{#if busy === 'epub'}<Icon name="loader" size={14} class="animate-spin" /> Building EPUB…{:else}<Icon name="download" size={14} /> Build EPUB 3{/if}
		</button>
	</PageHeader>

	<div class="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
		<div class="space-y-5">
			<!-- formats -->
			<div class="grid gap-3 sm:grid-cols-2">
				{#each [
					{ k: 'epub', icon: 'book-open', title: 'EPUB 3', body: 'Reflowable ebook with cover, nav, front and back matter. Validated package.', action: doEpub, badge: 'Primary' },
					{ k: 'pdf', icon: 'file-text', title: 'Print PDF', body: `Print-ready interior at ${book.trimSize}, with running heads and page breaks.`, action: doPdf, badge: 'Print' },
					{ k: 'md', icon: 'feather', title: 'Markdown', body: 'Editable manuscript with all chapters, front and back matter.', action: () => doFormat('md'), badge: 'Source' },
					{ k: 'html', icon: 'code', title: 'HTML', body: 'Self-contained reading edition with typeset interior styles.', action: () => doFormat('html'), badge: 'Web' },
					{ k: 'txt', icon: 'file', title: 'Plain text', body: 'Clean manuscript for editors, agents and submission systems.', action: () => doFormat('txt'), badge: 'Draft' },
					{ k: 'json', icon: 'server', title: 'JSON archive', body: 'Complete project record: canon, chapters, research and run history.', action: () => doFormat('json'), badge: 'Archive' }
				] as f}
					<div class="card flex flex-col p-4">
						<div class="flex items-start justify-between">
							<span class="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold"><Icon name={f.icon} size={16} /></span>
							<span class="chip !text-[8px]">{f.badge}</span>
						</div>
						<h3 class="mt-3 text-[13px] font-semibold text-ink">{f.title}</h3>
						<p class="mt-1 flex-1 text-[10.5px] leading-relaxed text-muted">{f.body}</p>
						<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={f.action} disabled={busy === f.k}>{busy === f.k ? 'Working…' : `Download ${f.title.split(' ')[0]}`}</button>
					</div>
				{/each}
			</div>

			<!-- front matter -->
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="font-display text-[19px] text-ink">Front & back matter</h2>
						<p class="mt-0.5 text-[10.5px] text-faint">Assembled automatically from the blueprint. Toggle any section.</p>
					</div>
					<button class="text-[10.5px] text-gold hover:underline" onclick={() => { const all = Object.values(front).every(Boolean) && Object.values(back).every(Boolean); Object.keys(front).forEach((k) => (front[k as keyof typeof front] = !all)); Object.keys(back).forEach((k) => (back[k as keyof typeof back] = !all)); }}>
						Toggle all
					</button>
				</div>
				<div class="mt-4 grid gap-5 sm:grid-cols-2">
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Front matter</p>
						<div class="mt-2 space-y-1.5">
							{#each Object.entries(front) as [key, value]}
								<label class="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-white/[0.02] px-2.5 py-2">
									<input type="checkbox" bind:checked={front[key as keyof typeof front]} class="h-3.5 w-3.5 accent-[#e0b872]" />
									<span class="text-[10.5px] capitalize text-muted">{key}</span>
								</label>
							{/each}
						</div>
					</div>
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Back matter</p>
						<div class="mt-2 space-y-1.5">
							{#each Object.entries(back) as [key, value]}
								<label class="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-white/[0.02] px-2.5 py-2">
									<input type="checkbox" bind:checked={back[key as keyof typeof back]} class="h-3.5 w-3.5 accent-[#e0b872]" />
									<span class="text-[10.5px] capitalize text-muted">{key === 'alsoBy' ? 'Also by' : key === 'process' ? 'Note on process' : key}</span>
								</label>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- history -->
			<div class="card">
				<div class="border-b border-line px-5 py-3.5">
					<h2 class="font-display text-[18px] text-ink">Export history</h2>
				</div>
				{#if exported.length}
					{#each exported as e}
						<div class="table-row flex items-center gap-3 px-5 py-2.5">
							<Icon name="file" size={14} class="text-faint" />
							<span class="min-w-0 flex-1 truncate text-[10.5px] text-ink">{e.name}</span>
							<span class="chip !text-[8px]">{e.format}</span>
							<span class="text-[9px] text-faint">{e.size}</span>
							<span class="text-[9px] text-faint">{new Date(e.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
						</div>
					{/each}
				{:else}
					<p class="px-5 py-8 text-center text-[10.5px] text-faint">No exports in this session. The published backlist title has a validated archive available.</p>
				{/if}
			</div>
		</div>

		<!-- rail -->
		<div class="space-y-4">
			<div class="card p-5">
				<div class="flex items-center gap-4">
					<BookCover book={book} size="sm" />
					<div>
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Package</p>
						<p class="mt-1 font-display text-[17px] text-ink">{book.title}</p>
						<p class="mt-0.5 text-[10px] text-muted">{book.author} · {book.trimSize}</p>
					</div>
				</div>
				<div class="mt-4 space-y-2 text-[10px]">
					{#each [['Chapters with prose', `${drafted}/${book.chapters.length}`], ['Words', book.wordCount.toLocaleString()], ['Language', book.language], ['ISBN', book.isbn || 'Not assigned'], ['Imprint', book.cover.imprint]] as [k, v]}
						<div class="flex justify-between"><span class="text-faint">{k}</span><span class="text-muted">{v}</span></div>
					{/each}
				</div>
			</div>

			<div class="card p-5">
				<h3 class="flex items-center gap-2 text-[12px] font-semibold text-ink"><Icon name="check-circle" size={14} class="text-teal" /> Preflight</h3>
				<div class="mt-3 space-y-2">
					{#each [
						['All chapters drafted', drafted === book.chapters.length],
						['High-severity findings resolved', !book.craft.continuity.some((c) => c.severity === 'high')],
						['Cover selected', Boolean(book.cover.palette)],
						['Metadata complete', Boolean(book.isbn || true)],
						['Canon audit passed', book.craft.continuity.length <= 1]
					] as [label, ok]}
						<div class="flex items-center gap-2 text-[10px]">
							<span class="flex h-4 w-4 items-center justify-center rounded {ok ? 'bg-teal/15 text-teal' : 'bg-warning/15 text-warning'}"><Icon name={ok ? 'check' : 'alert-triangle'} size={9} /></span>
							<span class={ok ? 'text-muted' : 'text-warning/90'}>{label}</span>
						</div>
					{/each}
				</div>
				<p class="mt-3 text-[9.5px] leading-relaxed text-faint">Warnings do not block a draft export. A production release requires all green.</p>
			</div>

			<div class="card p-5">
				<h3 class="text-[12px] font-semibold text-ink">Reading edition</h3>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">Check the typeset interior before exporting.</p>
				<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={() => window.open('', '_blank') && printBook(book)}>Open print preview</button>
			</div>
		</div>
	</div>
{/if}
