<script lang="ts">
import { studio } from '$lib/store.svelte';
import BookCover from '$lib/components/BookCover.svelte';
import Icon from '$lib/components/Icon.svelte';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { SITE } from '$lib/config';

let menuOpen = $state(false);
let demoBook = $state<'cartographer' | 'attention' | 'salthouse'>('cartographer');
onMount(() => studio.init());

const covers = [
	{ id: 'cartographer', label: 'Literary Fiction' },
	{ id: 'attention', label: 'Nonfiction' },
	{ id: 'salthouse', label: 'Series' }
] as const;

const selected = $derived(studio.books.find((b) => b.id === `book-${demoBook}`) ?? studio.books[0]);

const steps = [
	{ n: '01', title: 'Tell us the book you can already see', body: 'A brief, a voice sample, a half-finished outline — or just a subject you cannot stop thinking about. Idea Intake turns it into a promise, an audience, and a market position.' },
	{ n: '02', title: 'Approve the blueprint, not a blank page', body: 'Story bible, canon locks, character system, chapter architecture and scene circuits arrive before a single word of prose. You approve the plan once; every specialist works from it.' },
	{ n: '03', title: 'Let the studio draft, then keep control', body: 'Drafting, continuity, line editing, pacing, fact checks and cover design run as discrete, inspectable passes. Pause at any gate. Nothing ships without your signature.' },
	{ n: '04', title: 'Export a real book, not a text file', body: 'EPUB 3 with front matter, print-ready PDF at your trim size, Markdown, HTML and a complete JSON archive. Covers, spine, copyright, back matter — production ready.' }
];

const pillars = [
	{ icon: 'brain', title: 'Story bible & canon locks', body: 'Characters, world rules, timeline, glossary and locked invariants. Every chapter is checked against canon before it is allowed to ship.', tag: 'From LibriScribe + writing-template-for-ai' },
	{ icon: 'agents', title: 'Twelve specialist agents', body: 'Concept, research, outliner, character, worldbuilder, drafter, editor, continuity, pacing, fact-check, design and production. Narrow roles, explicit permissions.', tag: 'From LibriScribe multi-agent system' },
	{ icon: 'layers', title: 'Fractal scene architecture', body: 'Each scene must complete a circuit of change: want, crossing, search, find, cost, return, change. The craft engine audits every scene before drafting.', tag: 'From the fractal scene protocol' },
	{ icon: 'feather', title: 'Voice preservation', body: 'AI-ism suppression and semantic-gradient passes protect the sentence. Genre routing disables the rules that would mislead nonfiction or poetry.', tag: 'From prose-quality protocols' },
	{ icon: 'target', title: 'Market intelligence', body: 'Comparable titles, keyword opportunity, price bands, demand signals and a chapter-level cost estimate — before you commit the budget.', tag: 'From the KDP research toolkit' },
	{ icon: 'palette', title: 'Cover & interior design', body: 'Six palettes, six motif systems, four type directions. Front, back and spine, with a real typographic system — not a stock template.', tag: 'Harmonized from every cover workflow' },
	{ icon: 'file', title: 'Production-grade export', body: 'EPUB 3, print PDF, Markdown, HTML, TXT and JSON. Front matter, copyright, TOC, acknowledgements and colophon assembled automatically.', tag: 'From book-generator compile pipeline' },
	{ icon: 'shield', title: 'Enterprise governance', body: 'Seat management, role permissions, provider allow-lists, cost caps, audit trail, human approval gates and workspace-level data controls.', tag: 'Scriptora enterprise layer' }
];

const faqs = [
	{ q: 'Is this a toy that writes one generic chapter?', a: 'No. Scriptora is a production line: a locked story bible, scene-level architecture, a drafting pipeline with a persistent voice anchor, and editorial passes that run as separate, inspectable stages. The demo workspace ships with a real 48,000-word manuscript in progress, a complete nonfiction draft, a series bible and a published backlist title.' },
	{ q: 'Can I use my own model provider?', a: 'Yes. Bring OpenAI, Anthropic, Google, OpenRouter, Bedrock or a self-hosted endpoint. The Studio Engine is included for local drafting, and every agent can be routed to a different model with a fallback chain and a per-run budget cap.' },
	{ q: 'What does the $5,000 subscription include?', a: 'One enterprise workspace, up to 10 seats, unlimited books, all specialist agents, all craft protocols, market intelligence, cover design, the full export suite, provider routing, cost analytics and audit history. It is an annual plan, billed once per year.' },
	{ q: 'Do I own the copyright?', a: 'You own the manuscript, the cover, the exports and the underlying project data. Scriptora claims no rights over your work and does not train on your manuscripts. Human authorship and disclosure obligations remain yours to manage in your market.' },
	{ q: 'How does the continuity engine actually work?', a: 'Every project maintains a story bible with locked canon, a narrative graph of entities and events, and a set of invariants. Before a chapter is accepted, the auditor resolves references against that graph and raises findings by severity. High-severity findings require a human decision.' },
	{ q: 'Can my team work together?', a: 'Owners, editors, authors and viewers have distinct permissions. Editorial comments, approvals and version history are attributed. The audit log records who changed what and which agent produced it.' }
];

let openFaq = $state(0);

function enterDemo() {
	studio.login('amara@venn.co', 'Amara Venn', true);
	goto('/app');
}
</script>

<svelte:head>
	<title>Scriptora — The Enterprise AI Publishing Studio</title>
	<meta name="description" content="Blueprint, draft, edit, design and export complete books with an orchestrated team of specialist agents. Scriptora is the enterprise publishing studio." />
</svelte:head>

<div class="min-h-screen overflow-hidden bg-canvas text-ink">
	<!-- nav -->
	<header class="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
		<div class="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-5">
			<a href="/" class="flex items-center gap-2.5">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607]">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z" /><path d="M9 8h6M9 12h6M9 16h3" />
					</svg>
				</span>
				<span class="font-display text-[20px] tracking-tight">Scriptora</span>
			</a>
			<nav class="ml-6 hidden items-center gap-6 text-[12.5px] text-muted md:flex">
				<a class="transition hover:text-ink" href="#platform">Platform</a>
				<a class="transition hover:text-ink" href="#how">How it works</a>
				<a class="transition hover:text-ink" href="#pricing">Pricing</a>
				<a class="transition hover:text-ink" href="#faq">FAQ</a>
			</nav>
			<div class="ml-auto flex items-center gap-2">
				<a href="/login" class="btn btn-ghost hidden sm:inline-flex">Sign in</a>
				<a href="/login?demo=1" class="btn btn-primary">Enter the studio <Icon name="arrow-right" size={14} /></a>
				<button class="btn btn-ghost p-2 md:hidden" onclick={() => (menuOpen = !menuOpen)} aria-label="Menu"><Icon name="menu" size={18} /></button>
			</div>
		</div>
		{#if menuOpen}
			<div class="border-t border-line px-5 py-3 md:hidden">
				<div class="grid gap-2 text-[13px] text-muted">
					<a href="#platform" onclick={() => (menuOpen = false)}>Platform</a>
					<a href="#how" onclick={() => (menuOpen = false)}>How it works</a>
					<a href="#pricing" onclick={() => (menuOpen = false)}>Pricing</a>
					<a href="#faq" onclick={() => (menuOpen = false)}>FAQ</a>
				</div>
			</div>
		{/if}
	</header>

	<!-- hero -->
	<section class="grain relative overflow-hidden pt-32 sm:pt-40">
		<div class="pointer-events-none absolute inset-0">
			<div class="absolute left-[8%] top-[10%] h-[520px] w-[520px] rounded-full bg-gold/[0.07] blur-[130px]"></div>
			<div class="absolute right-[4%] top-[26%] h-[460px] w-[460px] rounded-full bg-teal/[0.05] blur-[120px]"></div>
			<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent"></div>
		</div>

		<div class="relative mx-auto grid max-w-[1240px] gap-14 px-5 pb-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8">
			<div class="rise-in">
				<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-gold">
					<span class="h-1.5 w-1.5 rounded-full bg-gold pulse-dot"></span>
					Enterprise publishing studio · 2026
				</div>
				<h1 class="font-display text-[44px] leading-[1.02] tracking-[-0.02em] sm:text-[60px] lg:text-[68px]">
					Write the book.<br />
					<span class="shimmer-text">Run the studio.</span>
				</h1>
				<p class="mt-6 max-w-[540px] text-[15px] leading-relaxed text-muted sm:text-[16px]">
					Scriptora harmonizes the best of seven book-generation systems into one enterprise studio: a locked story bible, twelve specialist agents, scene-level craft protocols, market intelligence, cover design and production-grade export.
				</p>
				<p class="mt-3 max-w-[520px] text-[13px] leading-relaxed text-faint">
					Not a prompt in a text box. A governed pipeline from concept to EPUB — with human approval at every gate.
				</p>
				<div class="mt-7 flex flex-wrap items-center gap-3">
					<a href="/login?demo=1" class="btn btn-primary btn-lg">Open the live demo <Icon name="arrow-up-right" size={15} /></a>
					<a href="#how" class="btn btn-secondary btn-lg">See the pipeline</a>
				</div>
				<div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-faint">
					<span class="flex items-center gap-1.5"><Icon name="check" size={13} class="text-teal" /> No credit card in demo</span>
					<span class="flex items-center gap-1.5"><Icon name="check" size={13} class="text-teal" /> Full manuscript included</span>
					<span class="flex items-center gap-1.5"><Icon name="check" size={13} class="text-teal" /> You own the rights</span>
				</div>
			</div>

			<!-- book stage -->
			<div class="relative mx-auto flex w-full max-w-[520px] items-center justify-center lg:max-w-none">
				<div class="absolute h-[360px] w-[360px] rounded-full border border-white/[0.04]"></div>
				<div class="absolute h-[480px] w-[480px] rounded-full border border-white/[0.03]"></div>
				<div class="relative flex items-end justify-center gap-[-20px]">
					<div class="translate-y-6 -rotate-[9deg] opacity-70 blur-[0.2px] transition-transform duration-500 hover:-translate-y-1 hover:rotate-[-7deg]">
						<BookCover book={studio.books.find((b) => b.id === 'book-salthouse')} size="md" />
					</div>
					<div class="relative z-10 -mx-6 -translate-y-2 rotate-[2deg] shadow-2xl transition-transform duration-500 hover:-translate-y-4">
						<BookCover book={studio.books.find((b) => b.id === 'book-cartographer')} size="lg" />
					</div>
					<div class="translate-y-8 rotate-[8deg] opacity-80 transition-transform duration-500 hover:-translate-y-1 hover:rotate-[6deg]">
						<BookCover book={studio.books.find((b) => b.id === 'book-attention')} size="md" />
					</div>
				</div>
				<div class="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-8 items-center gap-2 rounded-full border border-line bg-panel/90 px-3.5 py-2 text-[10.5px] text-muted shadow-xl backdrop-blur">
					<span class="h-1.5 w-1.5 rounded-full bg-teal"></span>
					<span class="mono">48,620</span> words drafted · <span class="mono">74%</span> complete
				</div>
			</div>
		</div>

		<!-- metrics strip -->
		<div class="relative border-y border-line bg-canvas-2/60">
			<div class="mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-line px-5 sm:grid-cols-4">
				{#each [['7', 'systems harmonized'], ['12', 'specialist agents'], ['8', 'craft protocols'], ['6', 'export formats']] as [n, label]}
					<div class="px-4 py-6 text-center">
						<p class="font-display text-[28px] text-ink">{n}</p>
						<p class="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-faint">{label}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- cover lab -->
	<section class="mx-auto max-w-[1240px] px-5 py-20">
		<div class="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
			<div>
				<p class="eyebrow">Design system</p>
				<h2 class="mt-3 font-display text-[32px] leading-tight sm:text-[40px]">A cover that looks like it belongs in a bookshop.</h2>
				<p class="mt-4 max-w-[460px] text-[13.5px] leading-relaxed text-muted">
					Six palettes. Six motif systems. Four typographic directions. Every cover is generated from the book's own themes, then rendered as a real front, back and spine — no stock templates, no AI-art mush.
				</p>
				<div class="mt-6 flex flex-wrap gap-2">
					{#each covers as c}
						<button
							class="chip transition {demoBook === c.id ? 'chip-gold' : ''}"
							onclick={() => (demoBook = c.id)}
						>{c.label}</button>
					{/each}
				</div>
				<div class="mt-7 grid max-w-[380px] grid-cols-2 gap-3 text-[11px] text-muted">
					<span class="flex items-center gap-2"><Icon name="check" size={13} class="text-teal" /> Front, back & spine</span>
					<span class="flex items-center gap-2"><Icon name="check" size={13} class="text-teal" /> Typographic hierarchy</span>
					<span class="flex items-center gap-2"><Icon name="check" size={13} class="text-teal" /> Series consistency</span>
					<span class="flex items-center gap-2"><Icon name="check" size={13} class="text-teal" /> Print-safe palettes</span>
				</div>
			</div>
			<div class="flex items-center justify-center gap-5 rounded-2xl border border-line bg-gradient-to-b from-white/[0.03] to-transparent p-8">
				<BookCover book={selected} size="lg" />
				<div class="hidden flex-col gap-5 sm:flex">
					<div class="rounded-lg border border-line bg-panel-3 px-4 py-3">
						<p class="text-[9px] uppercase tracking-[0.16em] text-faint">Palette</p>
						<p class="mt-1 text-[12px] capitalize text-ink">{selected?.cover.palette}</p>
					</div>
					<div class="rounded-lg border border-line bg-panel-3 px-4 py-3">
						<p class="text-[9px] uppercase tracking-[0.16em] text-faint">Motif</p>
						<p class="mt-1 text-[12px] capitalize text-ink">{selected?.cover.motif}</p>
					</div>
					<div class="rounded-lg border border-line bg-panel-3 px-4 py-3">
						<p class="text-[9px] uppercase tracking-[0.16em] text-faint">Typography</p>
						<p class="mt-1 text-[12px] capitalize text-ink">{selected?.cover.typography}</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- platform -->
	<section id="platform" class="relative border-y border-line bg-canvas-2/40 py-20">
		<div class="mx-auto max-w-[1240px] px-5">
			<div class="max-w-[680px]">
				<p class="eyebrow">Everything, harmonized</p>
				<h2 class="mt-3 font-display text-[32px] leading-tight sm:text-[42px]">Seven systems. One coherent studio.</h2>
				<p class="mt-4 text-[13.5px] leading-relaxed text-muted">
					We kept the best mechanism from every project and removed the seams. The result is one pipeline with one canon, one voice anchor and one production record.
				</p>
			</div>
			<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each pillars as p}
					<div class="card card-hover flex flex-col p-5">
						<span class="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.07] text-gold"><Icon name={p.icon} size={17} /></span>
						<h3 class="text-[13.5px] font-semibold text-ink">{p.title}</h3>
						<p class="mt-2 flex-1 text-[12px] leading-relaxed text-muted">{p.body}</p>
						<p class="mt-4 border-t border-line pt-3 text-[9.5px] uppercase tracking-[0.08em] text-faint">{p.tag}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- how -->
	<section id="how" class="mx-auto max-w-[1240px] px-5 py-20">
		<div class="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
			<div>
				<p class="eyebrow">The pipeline</p>
				<h2 class="mt-3 font-display text-[32px] leading-tight sm:text-[42px]">From a sentence to a shelf-ready book.</h2>
				<p class="mt-4 text-[13.5px] leading-relaxed text-muted">
					Each stage is a gate, not a checkbox. You can stop, inspect, reroute a model, rewrite the canon, or hand the manuscript to a human editor at any point.
				</p>
				<div class="mt-7 rounded-xl border border-line bg-panel p-4">
					<div class="flex items-center gap-2 text-[11px] text-muted">
						<Icon name="shield" size={14} class="text-teal" /> Human approval required
					</div>
					<p class="mt-2 text-[11.5px] leading-relaxed text-faint">High-severity continuity findings and every publication action pause the pipeline until a named human resolves them.</p>
				</div>
			</div>
			<div class="space-y-0">
				{#each steps as s, i}
					<div class="relative flex gap-5 pb-8">
						{#if i < steps.length - 1}<span class="absolute left-[19px] top-10 h-full w-px bg-line"></span>{/if}
						<span class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-canvas font-mono text-[10px] text-gold">{s.n}</span>
						<div class="pt-0.5">
							<h3 class="font-display text-[19px] text-ink">{s.title}</h3>
							<p class="mt-1.5 max-w-[560px] text-[12.5px] leading-relaxed text-muted">{s.body}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- evidence -->
	<section class="border-y border-line bg-canvas-2/40 py-16">
		<div class="mx-auto max-w-[1240px] px-5">
			<div class="grid gap-6 md:grid-cols-3">
				{#each [
					{ k: 'Voice integrity', v: '94%', note: 'AI-ism sweep, chapter 9 — Cartographer' },
					{ k: 'Continuity findings', v: '3', note: '1 high severity, resolved by human decision' },
					{ k: 'Production cost', v: '$31.18', note: 'Full book, all agents, all passes' }
				] as stat}
					<div class="card p-5">
						<p class="text-[10px] uppercase tracking-[0.14em] text-faint">{stat.k}</p>
						<p class="mt-2 font-display text-[32px] text-ink">{stat.v}</p>
						<p class="mt-1 text-[11px] text-muted">{stat.note}</p>
					</div>
				{/each}
			</div>
			<p class="mt-4 text-[10px] text-faint">Illustrative workspace metrics from the included demo catalogue.</p>
		</div>
	</section>

	<!-- pricing -->
	<section id="pricing" class="relative overflow-hidden py-20">
		<div class="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[120px]"></div>
		<div class="relative mx-auto max-w-[1000px] px-5">
			<div class="text-center">
				<p class="eyebrow">One plan. Every feature.</p>
				<h2 class="mt-3 font-display text-[34px] leading-tight sm:text-[44px]">The whole studio, for $5,000 a year.</h2>
				<p class="mx-auto mt-4 max-w-[560px] text-[13.5px] leading-relaxed text-muted">
					No feature tiers. No per-book fees. No credit packs. One enterprise subscription covers the team, the pipeline and every export format.
				</p>
			</div>
			<div class="mt-10 overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/[0.07] to-panel shadow-[0_30px_100px_-30px_rgba(224,184,114,.25)]">
				<div class="grid lg:grid-cols-[1fr_320px]">
					<div class="p-7 sm:p-9">
						<div class="flex items-center gap-2">
							<span class="chip chip-gold">Enterprise</span>
							<span class="text-[11px] text-faint">Annual subscription</span>
						</div>
						<div class="mt-4 flex items-baseline gap-2">
							<span class="font-display text-[52px] leading-none text-ink">$5,000</span>
							<span class="text-[13px] text-muted">/ year</span>
						</div>
						<p class="mt-2 text-[12px] text-faint">One workspace · up to 10 seats · unlimited books</p>
						<div class="mt-7 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
							{#each ['Unlimited books & manuscripts', 'All 12 specialist agents', 'All 8 craft protocols', 'Market & keyword intelligence', 'Cover design system', 'EPUB, PDF, DOCX, MD, HTML, JSON', 'Bring your own model providers', 'Cost caps & audit history', 'Approval gates & versioning', 'Priority production support'] as f}
								<span class="flex items-start gap-2 text-[12px] text-muted"><Icon name="check" size={13} class="mt-0.5 shrink-0 text-teal" /> {f}</span>
							{/each}
						</div>
					</div>
					<div class="flex flex-col justify-center border-t border-gold/15 bg-canvas/40 p-7 lg:border-l lg:border-t-0">
						<p class="text-[12px] leading-relaxed text-muted">Start in the full demo workspace with a complete manuscript, a series bible and a published title. Activate the plan when you are ready to produce.</p>
						<a href="/login?demo=1" class="btn btn-primary btn-lg mt-5 w-full">Open the demo</a>
						<a href="/login" class="btn btn-secondary mt-2 w-full">Activate enterprise</a>
						<p class="mt-4 text-center text-[10px] leading-relaxed text-faint">Billing is simulated in this build. No card is charged.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- faq -->
	<section id="faq" class="mx-auto max-w-[900px] px-5 py-20">
		<div class="text-center">
			<p class="eyebrow">Questions</p>
			<h2 class="mt-3 font-display text-[32px] sm:text-[40px]">The honest answers.</h2>
		</div>
		<div class="mt-9 divide-y divide-line rounded-2xl border border-line bg-panel/60">
			{#each faqs as f, i}
				<div>
					<button class="flex w-full items-center gap-4 px-5 py-4 text-left" onclick={() => (openFaq = openFaq === i ? -1 : i)}>
						<span class="flex-1 text-[13.5px] font-medium text-ink">{f.q}</span>
						<Icon name="chevron-down" size={15} class="shrink-0 text-faint transition-transform {openFaq === i ? 'rotate-180' : ''}" />
					</button>
					{#if openFaq === i}
						<p class="max-w-[760px] px-5 pb-5 text-[12.5px] leading-relaxed text-muted">{f.a}</p>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="mx-auto max-w-[1240px] px-5 pb-20">
		<div class="grain relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel-2 via-panel to-canvas px-6 py-14 text-center sm:px-12">
			<div class="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gold/[0.08] blur-[100px]"></div>
			<div class="relative">
				<p class="eyebrow">Your next book is already in there</p>
				<h2 class="mx-auto mt-3 max-w-[640px] font-display text-[32px] leading-tight sm:text-[44px]">Stop prompting. Start publishing.</h2>
				<p class="mx-auto mt-4 max-w-[480px] text-[13px] leading-relaxed text-muted">Enter the demo workspace and open a book that is already 74% produced.</p>
				<div class="mt-7 flex flex-wrap justify-center gap-3">
					<button class="btn btn-primary btn-lg" onclick={enterDemo}>Open the live demo <Icon name="arrow-right" size={15} /></button>
					<a href="/login" class="btn btn-secondary btn-lg">Use my workspace</a>
				</div>
			</div>
		</div>
	</section>

	<footer class="border-t border-line">
		<div class="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center">
			<div class="flex items-center gap-2.5">
				<span class="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold to-gold-deep text-[#201607]"><Icon name="feather" size={14} /></span>
				<span class="font-display text-[17px]">Scriptora</span>
			</div>
			<p class="text-[11px] text-faint">The enterprise publishing studio. Harmonized from open book-generation systems, rebuilt as one governed pipeline.</p>
			<div class="flex flex-wrap gap-5 text-[11px] text-muted sm:ml-auto">
				<a href="#platform" class="hover:text-ink">Platform</a>
				<a href="#pricing" class="hover:text-ink">Pricing</a>
				<a href="/login" class="hover:text-ink">Sign in</a>
				<a href={SITE.ewinEcosystem} class="hover:text-gold" target="_blank" rel="noreferrer">E-WIN ecosystem ↗</a>
			</div>
		</div>
		<div class="border-t border-line px-5 py-4 text-center text-[10px] text-faint">© 2026 Scriptora · Part of the <a class="text-muted hover:text-gold" href={SITE.ewinHub} target="_blank" rel="noreferrer">E-WIN Project Ecosystem</a> · Live Convex state, AGNES generation and Cloudflare edge delivery.</div>
	</footer>
</div>
