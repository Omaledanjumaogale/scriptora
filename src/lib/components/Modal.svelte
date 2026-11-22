<script lang="ts">
import { fade, scale } from 'svelte/transition';
import Icon from './Icon.svelte';
import type { Snippet } from 'svelte';

interface Props {
	open?: boolean;
	title?: string;
	subtitle?: string;
	children?: Snippet;
	footer?: Snippet;
	width?: string;
	onclose?: () => void;
}
let { open = $bindable(false), title = '', subtitle = '', children, footer, width = '540px', onclose }: Props = $props();

function close() {
	open = false;
	onclose?.();
}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && open && close()} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" transition:fade={{ duration: 140 }}>
		<button
			class="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
			aria-label="Close dialog"
			onclick={close}
		></button>
		<div
			class="relative max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-line-strong bg-panel shadow-[0_40px_120px_-20px_rgba(0,0,0,.9)] sm:rounded-2xl"
			style="max-width:{width}"
			transition:scale={{ duration: 170, start: 0.97 }}
		>
			<div class="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
				<div>
					<h2 class="text-[15px] font-semibold text-ink">{title}</h2>
					{#if subtitle}<p class="mt-0.5 text-xs text-muted">{subtitle}</p>{/if}
				</div>
				<button class="btn btn-ghost -mr-1 -mt-1 p-2" onclick={close} aria-label="Close">
					<Icon name="x" size={16} />
				</button>
			</div>
			<div class="max-h-[70vh] overflow-y-auto px-5 py-5">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="flex items-center justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3.5">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
