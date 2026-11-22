<script lang="ts">
interface Props {
	value: number;
	tone?: 'gold' | 'teal' | 'violet' | 'rose';
	height?: number;
	class?: string;
	showLabel?: boolean;
}
let { value, tone = 'gold', height = 6, class: className = '', showLabel = false }: Props = $props();
const colors = {
	gold: 'linear-gradient(90deg,#b98f4a,#efca8a)',
	teal: 'linear-gradient(90deg,#3f9e8b,#9be8d7)',
	violet: 'linear-gradient(90deg,#7c5cd6,#c4b5fd)',
	rose: 'linear-gradient(90deg,#c2586a,#f6bec4)'
};
const pct = $derived(Math.max(0, Math.min(100, Math.round(value))));
</script>

<div class="flex items-center gap-2 {className}">
	<div class="relative flex-1 overflow-hidden rounded-full bg-white/[0.06]" style="height:{height}px">
		<div class="h-full rounded-full transition-[width] duration-500" style="width:{pct}%;background:{colors[tone]}"></div>
	</div>
	{#if showLabel}
		<span class="mono text-[10px] text-faint tabular-nums">{pct}%</span>
	{/if}
</div>
