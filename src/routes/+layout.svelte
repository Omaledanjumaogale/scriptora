<script lang="ts">
import '../app.css';
import { onMount } from 'svelte';
import { studio } from '$lib/store.svelte';
import Toast from '$lib/components/Toast.svelte';
import type { Snippet } from 'svelte';

let { children }: { children: Snippet } = $props();

onMount(() => {
	studio.init();
});
</script>

{@render children()}
<Toast />
