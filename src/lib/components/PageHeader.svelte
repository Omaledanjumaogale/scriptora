<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';

interface Props {
	eyebrow?: string;
	title: string;
	description?: string;
	children?: Snippet;
}
let { eyebrow = '', title, description = '', children }: Props = $props();
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		{#if eyebrow}<p class="eyebrow mb-2">{eyebrow}</p>{/if}
		<h1 class="font-display text-[26px] leading-tight tracking-tight text-ink sm:text-[30px]">{title}</h1>
		{#if description}<p class="mt-2 max-w-[680px] text-[13px] leading-relaxed text-muted">{description}</p>{/if}
	</div>
	{#if children}
		<div class="flex shrink-0 flex-wrap items-center gap-2">{@render children()}</div>
	{/if}
</div>
