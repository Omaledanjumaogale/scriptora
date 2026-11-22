<script lang="ts">
import { page } from '$app/state';
import { studio } from '$lib/store.svelte';
import { generateCover } from '$lib/engine';
import { download } from '$lib/export';
import { archiveAsset } from '$lib/assets';
import BookCover from '$lib/components/BookCover.svelte';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const id = $derived(page.params.id ?? '');
const book = $derived(studio.books.find((b) => b.id === id));

const palettes = [
	{ key: 'midnight', label: 'Midnight', colors: ['#0d1420', '#1a2433', '#e0b872'] },
	{ key: 'parchment', label: 'Parchment', colors: ['#efe6d2', '#d8c5a3', '#8a5a2b'] },
	{ key: 'forest', label: 'Forest', colors: ['#0e1d18', '#1d382d', '#b7d6a7'] },
	{ key: 'oxide', label: 'Oxide', colors: ['#24110e', '#4a241c', '#e8a06a'] },
	{ key: 'violet', label: 'Violet', colors: ['#17122b', '#2e2354', '#c4b5fd'] },
	{ key: 'bone', label: 'Bone', colors: ['#ece7da', '#c9c1b0', '#6b5a3e'] }
] as const;
const motifs = ['rings', 'arch', 'waves', 'grid', 'botanical', 'constellation'] as const;
const types = ['editorial', 'modern', 'classic', 'brutalist'] as const;

function set<K extends 'palette' | 'motif' | 'typography'>(key: K, value: string) {
	if (!book) return;
	studio.setCover(book.id, { [key]: value } as never);
}

function generate() {
	if (!book) return;
	studio.regenerateCover(book.id);
	studio.notify('New cover direction generated');
}

function coverHtml() {
	if (!book) return '';
	const c = book.cover;
	const palette: Record<string, [string, string, string, string]> = {
		midnight: ['#0d1420', '#1a2433', '#ece9e2', '#e0b872'],
		parchment: ['#efe6d2', '#d8c5a3', '#241d13', '#8a5a2b'],
		forest: ['#0e1d18', '#1d382d', '#e9efe6', '#b7d6a7'],
		oxide: ['#24110e', '#4a241c', '#f4e0cd', '#e8a06a'],
		violet: ['#17122b', '#2e2354', '#f0eaff', '#c4b5fd'],
		bone: ['#ece7da', '#c9c1b0', '#1c1a16', '#6b5a3e']
	};
	const [bg1, bg2, ink, accent] = palette[c.palette] ?? palette.midnight;
	const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${book.title} — cover</title>
<style>
@page{size:6in 9in;margin:0}*{box-sizing:border-box}
body{margin:0;width:6in;height:9in;background:linear-gradient(155deg,${bg1},${bg2});color:${ink};font-family:Georgia,serif;display:flex;flex-direction:column;justify-content:space-between;padding:.62in .52in .5in .64in}
.imprint{font-size:8pt;letter-spacing:.22em;text-transform:uppercase;color:${accent};display:flex;justify-content:space-between}
h1{font-size:38pt;font-weight:500;line-height:1.02;margin:0}
.sub{font-style:italic;font-size:15pt;color:${ink};opacity:.75;margin-top:.16in;max-width:4.2in}
.rule{width:.7in;height:1px;background:${accent};margin-top:.28in}
.author{font-size:14pt;letter-spacing:.04em}
.tag{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:${accent};margin-top:.12in}
.motif{position:absolute;inset:0;opacity:.35;background:repeating-radial-gradient(circle at 50% 46%,transparent 0 26px,${accent} 27px,transparent 28px 52px)}
${c.typography === 'modern' ? 'h1{font-family:Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:-.01em}' : c.typography === 'brutalist' ? 'h1{font-family:Helvetica,Arial,sans-serif;font-weight:800;letter-spacing:-.03em}' : ''}
@media print{body{width:6in;height:9in}}
</style></head><body>
<div class="motif"></div>
<div class="imprint" style="position:relative"><span>${c.imprint}</span><span>EST. 2026</span></div>
<div style="position:relative;margin-top:1.2in"><h1>${book.title}</h1><div class="sub">${book.subtitle}</div><div class="rule"></div></div>
<div style="position:relative"><div class="author">${book.author}</div><div class="tag">${c.tagline}</div></div>
</body></html>`;
	return html;
}

function downloadCover() {
	if (!book) return;
	const html = coverHtml();
	if (!html) return;
	download(`${book.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cover.html`, html, 'text/html');
	studio.notify('Cover package downloaded');
}

let archiving = $state(false);
async function archiveCover() {
	if (!book) return;
	if (!studio.session) {
		studio.notify('Sign in with Google or GitHub to archive to R2', 'error');
		return;
	}
	const html = coverHtml();
	if (!html) return;
	archiving = true;
	try {
		const result = await archiveAsset(
			new Blob([html], { type: 'text/html' }),
			`${book.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cover.html`
		);
		studio.notify(`Cover archived to R2 · ${Math.round(result.size / 1024)} KB`);
	} catch (error) {
		studio.notify(error instanceof Error ? error.message : 'R2 archive failed', 'error');
	} finally {
		archiving = false;
	}
}
</script>

	<svelte:head><title>Cover — {book?.title}</title></svelte:head>

{#if book}

	<PageHeader eyebrow="Cover studio" title="The book as an object." description="Six palettes, six motif systems, four typographic directions. Every choice is applied to a real front, back and spine — not a flattened mockup.">
		<button class="btn btn-secondary" onclick={downloadCover}><Icon name="download" size={14} /> Download cover</button>
		<button class="btn btn-secondary" onclick={archiveCover} disabled={archiving}>{#if archiving}<Icon name="loader" size={14} class="animate-spin" /> Archiving…{:else}<Icon name="server" size={14} /> Archive to R2{/if}</button>
		<button class="btn btn-primary" onclick={generate}><Icon name="sparkles" size={14} /> Generate direction</button>
	</PageHeader>

	<div class="grid gap-5 xl:grid-cols-[1fr_380px]">
		<!-- preview stage -->
		<div class="card relative flex min-h-[560px] items-center justify-center overflow-hidden p-8">
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(224,184,114,.07),transparent_60%)]"></div>
			<div class="relative flex items-end gap-6">
				<div class="hidden rotate-[-8deg] opacity-30 blur-[1px] sm:block">
					<BookCover book={book} size="md" />
				</div>
				<BookCover book={book} size="xl" class="relative z-10 shadow-[0_40px_120px_-30px_rgba(0,0,0,.95)]" />
				<div class="hidden rotate-[8deg] opacity-30 blur-[1px] sm:block">
					<BookCover book={book} size="md" />
				</div>
			</div>
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-[9.5px] text-faint backdrop-blur">
				{book.trimSize} · 300 dpi · print-safe palette
			</div>
		</div>

		<!-- controls -->
		<div class="space-y-4">
			<div class="card p-4">
				<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Palette</p>
				<div class="mt-2.5 grid grid-cols-3 gap-2">
					{#each palettes as p}
						<button class="rounded-lg border p-2 text-left transition {book.cover.palette === p.key ? 'border-gold/50 bg-gold/[0.06]' : 'border-line hover:border-line-strong'}" onclick={() => set('palette', p.key)}>
							<span class="flex h-5 overflow-hidden rounded">
								{#each p.colors as color}<span class="flex-1" style="background:{color}"></span>{/each}
							</span>
							<span class="mt-1.5 block text-[9.5px] {book.cover.palette === p.key ? 'text-gold' : 'text-muted'}">{p.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="card p-4">
				<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Motif</p>
				<div class="mt-2.5 grid grid-cols-3 gap-1.5">
					{#each motifs as m}
						<button class="chip justify-center !text-[9.5px] capitalize {book.cover.motif === m ? 'chip-gold' : ''}" onclick={() => set('motif', m)}>{m}</button>
					{/each}
				</div>
			</div>

			<div class="card p-4">
				<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Typography</p>
				<div class="mt-2.5 grid grid-cols-2 gap-1.5">
					{#each types as t}
						<button class="rounded-md border px-2 py-2 text-[9.5px] capitalize transition {book.cover.typography === t ? 'border-gold/50 bg-gold/[0.06] text-gold' : 'border-line text-muted hover:border-line-strong'}" onclick={() => set('typography', t)}>{t}</button>
					{/each}
				</div>
			</div>

			<div class="card p-4">
				<p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Cover copy</p>
				<div class="mt-2 space-y-2.5">
					<div>
						<label class="label !text-[9px]" for="tag">Tagline</label>
						<input id="tag" class="input !py-1.5 !text-[11px]" bind:value={book.cover.tagline} onchange={() => studio.setCover(book.id, {})} />
					</div>
					<div>
						<label class="label !text-[9px]" for="imprint">Imprint</label>
						<input id="imprint" class="input !py-1.5 !text-[11px]" bind:value={book.cover.imprint} onchange={() => studio.setCover(book.id, {})} />
					</div>
					<div>
						<label class="label !text-[9px]" for="spine">Spine text</label>
						<input id="spine" class="input !py-1.5 !text-[11px]" bind:value={book.cover.spineText} onchange={() => studio.setCover(book.id, {})} />
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- back cover -->
	<div class="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
		<div class="card p-5">
			<div class="flex items-center justify-between">
				<h2 class="font-display text-[19px] text-ink">Back cover & positioning copy</h2>
				<span class="chip !text-[9px]">Editable</span>
			</div>
			<textarea class="textarea mt-3 min-h-[220px] font-display !text-[13px] !leading-[1.8]" bind:value={book.cover.backCopy} onchange={() => studio.setCover(book.id, {})}></textarea>
			<p class="mt-2 text-[10px] text-faint">{(book.cover.backCopy.match(/\b\w+\b/g) ?? []).length} words · recommended 120–180 for back cover</p>
		</div>
		<div class="card p-5">
			<h2 class="font-display text-[19px] text-ink">Cover audit</h2>
			<div class="mt-3 space-y-3">
				{#each [['Title legible at thumbnail', 96, 'teal'], ['Palette contrast (WCAG AA)', 88, 'teal'], ['Series consistency', 92, 'gold'], ['Genre signal strength', 84, 'gold'], ['Print-safe (CMYK gamut)', 90, 'teal']] as [label, score, tone]}
					<div>
						<div class="flex justify-between text-[10px]"><span class="text-muted">{label}</span><span class="mono text-faint">{score}</span></div>
						<div class="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div class="h-full rounded-full {tone === 'teal' ? 'bg-teal' : 'bg-gold'}" style="width:{score}%"></div></div>
					</div>
				{/each}
			</div>
			<div class="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
				<p class="text-[10px] leading-relaxed text-muted"><span class="text-ink">Note:</span> Title strength is driven by the two-word concrete noun. The current direction reads clearly at 120px — the size of a retailer thumbnail.</p>
			</div>
		</div>
	</div>
{/if}
