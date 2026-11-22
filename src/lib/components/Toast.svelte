<script lang="ts">
import { fly } from 'svelte/transition';
import { studio } from '$lib/store.svelte';
import Icon from './Icon.svelte';

const tone = $derived(
	studio.toast?.kind === 'error'
		? 'border-danger/30 bg-[#2a1418] text-rose-200'
		: studio.toast?.kind === 'info'
			? 'border-line-strong bg-panel-2 text-ink'
			: 'border-success/25 bg-[#0f211c] text-emerald-100'
);
</script>

{#if studio.toast}
	<div
		class="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] shadow-2xl {tone}"
		transition:fly={{ y: 16, duration: 220 }}
		role="status"
	>
		<Icon
			name={studio.toast.kind === 'error' ? 'alert-triangle' : studio.toast.kind === 'info' ? 'sparkles' : 'check-circle'}
			size={16}
		/>
		<span>{studio.toast.message}</span>
		<button class="ml-2 opacity-60 hover:opacity-100" onclick={() => (studio.toast = null)} aria-label="Dismiss">
			<Icon name="x" size={13} />
		</button>
	</div>
{/if}
