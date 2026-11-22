<script lang="ts">
import { studio } from '$lib/store.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { onMount } from 'svelte';
import Icon from '$lib/components/Icon.svelte';

let email = $state('amara@venn.co');
let name = $state('Amara Venn');
let loading = $state(false);
let error = $state('');

const demo = $derived(page.url.searchParams.get('demo') === '1');

onMount(() => {
	studio.init();
	if (demo) {
		studio.login('amara@venn.co', 'Amara Venn', true);
		goto('/app');
	}
});

function submit(e: Event) {
	e.preventDefault();
	if (!email.includes('@')) {
		error = 'Enter a valid work email.';
		return;
	}
	loading = true;
	setTimeout(() => {
		studio.login(email, name, false);
		goto(studio.state.onboarded ? '/app' : '/onboarding');
	}, 550);
}

function sso(provider: 'Google' | 'Microsoft') {
	studio.login(provider === 'Google' ? 'amara@venn.co' : 'amara@venn.co', 'Amara Venn', false);
	goto(studio.state.onboarded ? '/app' : '/onboarding');
}
</script>

<svelte:head><title>Sign in — Scriptora</title></svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
	<!-- left editorial panel -->
	<div class="grain relative hidden overflow-hidden border-r border-line bg-canvas-2 lg:block">
		<div class="pointer-events-none absolute -left-20 top-10 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-[110px]"></div>
		<div class="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-teal/[0.05] blur-[110px]"></div>
		<div class="relative flex h-full flex-col justify-between p-12">
			<a href="/" class="flex items-center gap-2.5">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607]">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
				</span>
				<span class="font-display text-[20px]">Scriptora</span>
			</a>
			<div class="max-w-[460px]">
				<div class="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gold">
					<span class="h-px w-8 bg-gold/50"></span> Venn & Co. Publishing
				</div>
				<blockquote class="font-display text-[30px] leading-[1.35] text-ink/95">
					“The first studio I have used where the manuscript, the canon, the cover and the export actually agree with each other.”
				</blockquote>
				<div class="mt-7 flex items-center gap-3">
					<span class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3a2c14] to-[#20180b] text-[11px] font-semibold text-gold">AV</span>
					<div>
						<p class="text-[12px] text-ink">Amara Venn</p>
						<p class="text-[10.5px] text-faint">Author · The Cartographer of Silence</p>
					</div>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-4 border-t border-line pt-6">
				{#each [['74%', 'manuscript'], ['91', 'quality score'], ['$5k', 'annual plan']] as [v, l]}
					<div>
						<p class="font-display text-[22px] text-ink">{v}</p>
						<p class="mt-0.5 text-[9.5px] uppercase tracking-[0.12em] text-faint">{l}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- form -->
	<div class="flex items-center justify-center px-5 py-12">
		<div class="w-full max-w-[400px]">
			<a href="/" class="mb-10 flex items-center gap-2.5 lg:hidden">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607]"><Icon name="feather" size={15} /></span>
				<span class="font-display text-[20px]">Scriptora</span>
			</a>
			<p class="eyebrow">Workspace access</p>
			<h1 class="mt-2 font-display text-[32px] leading-tight">Sign in to the studio.</h1>
			<p class="mt-2 text-[13px] text-muted">Use your work account. This build runs locally — no credentials leave your browser.</p>

			<form class="mt-8 space-y-4" onsubmit={submit}>
				<div>
					<label class="label" for="email">Work email</label>
					<input id="email" class="input" type="email" bind:value={email} placeholder="you@studio.com" autocomplete="email" />
				</div>
				<div>
					<label class="label" for="name">Your name</label>
					<input id="name" class="input" type="text" bind:value={name} placeholder="Amara Venn" autocomplete="name" />
				</div>
				{#if error}<p class="text-[11.5px] text-danger">{error}</p>{/if}
				<button class="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
					{#if loading}<Icon name="loader" size={15} class="animate-spin" /> Opening workspace…{:else}Continue <Icon name="arrow-right" size={15} />{/if}
				</button>
			</form>

			<div class="my-6 flex items-center gap-3">
				<span class="h-px flex-1 bg-line"></span><span class="text-[10px] uppercase tracking-[0.12em] text-faint">or</span><span class="h-px flex-1 bg-line"></span>
			</div>

			<div class="grid gap-2">
				<button class="btn btn-secondary w-full" onclick={() => sso('Google')}>
					<svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8z"/><path fill="#34A853" d="M12 23c2.8 0 5.2-.9 7-2.5l-3.6-2.7c-1 .7-2.2 1.1-3.4 1.1-2.7 0-5-1.8-5.8-4.3H2.5v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M6.2 14.6a6.6 6.6 0 0 1 0-4.2V7.6H2.5a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.5 0 2.9.5 4 1.5l3-3A11 11 0 0 0 2.5 7.6l3.7 2.8C7 7.9 9.3 5.4 12 5.4z"/></svg>
					Continue with Google
				</button>
				<button class="btn btn-secondary w-full" onclick={() => sso('Microsoft')}>
					<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
					Continue with Microsoft
				</button>
			</div>

			<div class="mt-6 rounded-xl border border-gold/20 bg-gold/[0.05] p-4">
				<p class="flex items-center gap-2 text-[11.5px] font-medium text-gold"><Icon name="sparkles" size={14} /> Reviewer shortcut</p>
				<p class="mt-1.5 text-[11px] leading-relaxed text-muted">Open the fully populated demo workspace with a 48k-word manuscript, series bible and live agent runs.</p>
				<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={() => { studio.login('amara@venn.co', 'Amara Venn', true); goto('/app'); }}>Enter demo workspace</button>
			</div>

			<p class="mt-6 text-center text-[10px] leading-relaxed text-faint">By continuing you agree to the demo terms. No payment is collected in this build.</p>
		</div>
	</div>
</div>
