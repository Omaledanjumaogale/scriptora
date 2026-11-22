<script lang="ts">
import type { Book, CoverDesign } from '$lib/types';

interface Props {
	book?: Pick<Book, 'title' | 'subtitle' | 'author' | 'cover'>;
	cover?: CoverDesign;
	title?: string;
	subtitle?: string;
	author?: string;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	class?: string;
}

let { book, cover, title = '', subtitle = '', author = '', size = 'md', class: className = '' }: Props = $props();

const c = $derived(cover ?? book?.cover);
const t = $derived(title || book?.title || 'Untitled');
const s = $derived(subtitle || book?.subtitle || '');
const a = $derived(author || book?.author || '');

const widths = { xs: 64, sm: 120, md: 210, lg: 300, xl: 380 };
const w = $derived(widths[size]);
const h = $derived(Math.round(w * 1.5));

const palettes = {
	midnight: { bg1: '#0d1420', bg2: '#1a2433', ink: '#ece9e2', soft: '#b8c0cc', accent: '#e0b872' },
	parchment: { bg1: '#efe6d2', bg2: '#d8c5a3', ink: '#241d13', soft: '#5e4c36', accent: '#8a5a2b' },
	forest: { bg1: '#0e1d18', bg2: '#1d382d', ink: '#e9efe6', soft: '#a9bbae', accent: '#b7d6a7' },
	oxide: { bg1: '#24110e', bg2: '#4a241c', ink: '#f4e0cd', soft: '#d2ad99', accent: '#e8a06a' },
	violet: { bg1: '#17122b', bg2: '#2e2354', ink: '#f0eaff', soft: '#b9add9', accent: '#c4b5fd' },
	bone: { bg1: '#ece7da', bg2: '#c9c1b0', ink: '#1c1a16', soft: '#5b5548', accent: '#6b5a3e' }
} as const;

const p = $derived(palettes[c?.palette ?? 'midnight']);
const motif = $derived(c?.motif ?? 'rings');
const type = $derived(c?.typography ?? 'editorial');

const titleSize = $derived(
	size === 'xs' ? 7 : size === 'sm' ? 12 : size === 'md' ? 20 : size === 'lg' ? 27 : 34
);
const subSize = $derived(size === 'xs' ? 4 : size === 'sm' ? 6.5 : size === 'md' ? 9.5 : size === 'lg' ? 12 : 15);
const authorSize = $derived(size === 'xs' ? 4 : size === 'sm' ? 6 : size === 'md' ? 8 : size === 'lg' ? 10 : 12);
</script>

<div
	class="relative shrink-0 overflow-hidden rounded-[3px] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.85)] {className}"
	style="width:{w}px;height:{h}px;background:linear-gradient(155deg,{p.bg1},{p.bg2});color:{p.ink};"
	aria-label="{t} cover"
>
	<!-- spine -->
	<div
		class="absolute inset-y-0 left-0"
		style="width:{Math.max(3, w * 0.035)}px;background:linear-gradient(90deg,rgba(0,0,0,.42),rgba(255,255,255,.10) 60%,rgba(0,0,0,.18));"
	></div>
	<!-- motif -->
	<svg class="absolute inset-0 h-full w-full" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
		{#if motif === 'rings'}
			{#each [36, 58, 80, 102, 124] as r, i}
				<circle cx="100" cy="138" r={r} fill="none" stroke={p.accent} stroke-width={i === 2 ? 0.9 : 0.45} opacity={0.42 - i * 0.05} />
			{/each}
			<circle cx="100" cy="138" r="4" fill={p.accent} opacity="0.75" />
		{:else if motif === 'arch'}
			{#each [0, 1, 2, 3] as i}
				<path d="M{38 + i * 30} 260 L{38 + i * 30} {140 - i * 14} Q{38 + i * 30} {92 - i * 14} {68 + i * 30} {92 - i * 14} Q{98 + i * 30} {92 - i * 14} {98 + i * 30} {140 - i * 14} L{98 + i * 30} 260" fill="none" stroke={p.accent} stroke-width="0.7" opacity={0.34 - i * 0.05} />
			{/each}
		{:else if motif === 'waves'}
			{#each Array(9) as _, i}
				<path d="M-10 {92 + i * 17} C 40 {74 + i * 17}, 70 {112 + i * 17}, 110 {92 + i * 17} S 180 {74 + i * 17}, 215 {94 + i * 17}" fill="none" stroke={p.accent} stroke-width="0.6" opacity={0.36 - i * 0.022} />
			{/each}
		{:else if motif === 'grid'}
			{#each Array(11) as _, row}
				{#each Array(7) as _, col}
					<circle cx={16 + col * 28} cy={64 + row * 22} r="1.15" fill={p.accent} opacity={0.4 - row * 0.016} />
				{/each}
			{/each}
		{:else if motif === 'botanical'}
			{#each Array(5) as _, i}
				<path d="M{40 + i * 30} 270 Q{45 + i * 30} 200 {52 + i * 30} 140" fill="none" stroke={p.accent} stroke-width="0.7" opacity="0.32" />
				{#each Array(4) as _, j}
					<ellipse cx={49 + i * 30 + (j % 2 === 0 ? -8 : 8)} cy={240 - j * 26 - i * 6} rx="8" ry="3.2" fill="none" stroke={p.accent} stroke-width="0.55" opacity="0.32" transform="rotate({j % 2 === 0 ? -28 : 28} {49 + i * 30} {240 - j * 26 - i * 6})" />
				{/each}
			{/each}
		{:else}
			{#each Array(22) as _, i}
				<circle cx={14 + ((i * 53) % 172)} cy={54 + ((i * 37) % 200)} r={i % 4 === 0 ? 1.7 : 0.9} fill={p.accent} opacity="0.5" />
			{/each}
			<path d="M22 76 L70 120 L118 96 L165 150 L182 118" fill="none" stroke={p.accent} stroke-width="0.5" opacity="0.28" />
			<path d="M38 210 L84 176 L132 208 L176 172" fill="none" stroke={p.accent} stroke-width="0.5" opacity="0.22" />
		{/if}
	</svg>

	<div class="relative flex h-full flex-col justify-between" style="padding:{w * 0.09}px {w * 0.1}px {w * 0.08}px {w * 0.13}px">
		<div class="flex items-center justify-between" style="font-size:{authorSize * 0.85}px;letter-spacing:.18em;color:{p.soft};text-transform:uppercase;">
			<span>{c?.imprint ?? 'Scriptora Press'}</span>
			{#if size !== 'xs'}<span style="opacity:.7">EST. 2026</span>{/if}
		</div>

		<div class="flex-1 flex flex-col justify-center" style="padding-top:{h * 0.06}px;">
			<div
				style="font-family:var(--font-display);font-size:{titleSize}px;line-height:1.03;letter-spacing:{type === 'modern' ? '-0.01em' : type === 'brutalist' ? '-0.03em' : '0.005em'};font-weight:{type === 'brutalist' ? 700 : 500};text-transform:{type === 'modern' ? 'uppercase' : 'none'};"
			>
				{t}
			</div>
			{#if s && size !== 'xs'}
				<div style="margin-top:{w * 0.03}px;font-family:var(--font-display);font-style:italic;font-size:{subSize}px;line-height:1.3;color:{p.soft};max-width:88%;">
					{s}
				</div>
			{/if}
			{#if size !== 'xs'}
				<div style="margin-top:{w * 0.05}px;width:{w * 0.16}px;height:1px;background:{p.accent};opacity:.8;"></div>
			{/if}
		</div>

		<div>
			{#if size !== 'xs'}
				<div style="font-family:var(--font-display);font-size:{authorSize}px;letter-spacing:.06em;color:{p.ink};">
					{a}
				</div>
			{/if}
			{#if size === 'lg' || size === 'xl'}
				<div style="margin-top:{w * 0.03}px;font-size:{authorSize * 0.8}px;letter-spacing:.12em;text-transform:uppercase;color:{p.accent};opacity:.85;">
					{c?.tagline ?? ''}
				</div>
			{/if}
		</div>
	</div>

	<!-- paper sheen -->
	<div class="pointer-events-none absolute inset-0" style="background:linear-gradient(120deg,rgba(255,255,255,.08),transparent 30%,transparent 70%,rgba(0,0,0,.12));"></div>
</div>
