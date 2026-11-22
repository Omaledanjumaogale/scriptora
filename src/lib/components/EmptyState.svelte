<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';

interface Props {
	icon?: string;
	title: string;
	description?: string;
	children?: Snippet;
}
let { icon = 'book', title, description = '', children }: Props = $props();
</script>

<div class="card flex flex-col items-center justify-center px-6 py-14 text-center">
	<span class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-gold">
		<Icon name={icon} size={22} />
	</span>
	<h3 class="font-display text-lg text-ink">{title}</h3>
	{#if description}<p class="mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted">{description}</p>{/if}
	{#if children}<div class="mt-5">{@render children()}</div>{/if}
</div>
