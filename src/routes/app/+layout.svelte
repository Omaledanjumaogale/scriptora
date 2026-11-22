<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { studio } from '$lib/store.svelte';
import AppShell from '$lib/components/AppShell.svelte';
import CommandPalette from '$lib/components/CommandPalette.svelte';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();
let mounted = $state(false);

onMount(() => {
	studio.init();
	mounted = true;
});

$effect(() => {
	if (!mounted || !studio.authResolved) return;
	if (!studio.authed) goto('/login');
	else if (!studio.state.onboarded) goto('/onboarding');
});
</script>

{#if mounted && studio.authResolved && studio.hasAccess}
	<AppShell>
		{@render children()}
	</AppShell>
	<CommandPalette />
{:else}
	<div class="flex min-h-screen items-center justify-center bg-canvas">
		<div class="flex flex-col items-center gap-3">
			<span class="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold"></span>
			<p class="text-[12px] text-faint">Opening your studio…</p>
		</div>
	</div>
{/if}
