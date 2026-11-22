<script lang="ts">
interface Props {
	data: number[];
	width?: number;
	height?: number;
	color?: string;
	fill?: boolean;
}
let { data, width = 120, height = 36, color = '#e0b872', fill = true }: Props = $props();
const min = $derived(Math.min(...data));
const max = $derived(Math.max(...data));
const range = $derived(max - min || 1);
const points = $derived(
	data
		.map((v, i) => `${(i / (data.length - 1 || 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`)
		.join(' ')
);
const area = $derived(`0,${height} ${points} ${width},${height}`);
</script>

<svg viewBox="0 0 {width} {height}" width={width} height={height} class="overflow-visible" aria-hidden="true">
	{#if fill}
		<polygon points={area} fill={color} opacity="0.12" />
	{/if}
	<polyline points={points} fill="none" stroke={color} stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
</svg>
