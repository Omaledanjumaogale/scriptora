<script lang="ts">
interface Props {
	value: number;
	size?: number;
	stroke?: number;
	label?: string;
	color?: string;
}
let { value, size = 84, stroke = 6, label = '', color = '#e0b872' }: Props = $props();
const r = $derived((size - stroke) / 2);
const circ = $derived(2 * Math.PI * r);
const pct = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="relative inline-flex items-center justify-center" style="width:{size}px;height:{size}px">
	<svg width={size} height={size} class="-rotate-90">
		<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" stroke-width={stroke} />
		<circle
			cx={size / 2}
			cy={size / 2}
			r={r}
			fill="none"
			stroke={color}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circ}
			stroke-dashoffset={circ - (pct / 100) * circ}
			style="transition:stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)"
		/>
	</svg>
	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span class="font-display text-xl leading-none text-ink">{Math.round(pct)}</span>
		{#if label}<span class="mt-1 text-[9px] uppercase tracking-[0.14em] text-faint">{label}</span>{/if}
	</div>
</div>
