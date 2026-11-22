<script lang="ts">
import { studio } from '$lib/store.svelte';
import { goto } from '$app/navigation';
import { PLAN_PRICE } from '$lib/seed';
import Icon from '$lib/components/Icon.svelte';

let step = $state(0);
let company = $state('Venn & Co. Publishing');
let email = $state(studio.user?.email ?? 'amara@venn.co');
let card = $state('4242 4242 4242 4242');
let activating = $state(false);

const steps = ['Workspace', 'Plan', 'Confirm'];

function activate() {
	activating = true;
	setTimeout(() => {
		studio.activatePlan(email, company);
		goto('/app');
	}, 900);
}

const included = [
	'Unlimited books, manuscripts and series',
	'All 12 specialist agents and 8 craft protocols',
	'Market, keyword and comparable-title intelligence',
	'Cover design system with front / back / spine',
	'EPUB 3, print PDF, DOCX, Markdown, HTML, TXT, JSON',
	'Bring your own providers with routing and fallbacks',
	'10 seats with role-based permissions',
	'Cost caps, audit history and approval gates'
];
</script>

<svelte:head><title>Activate Scriptora Enterprise</title></svelte:head>

<div class="min-h-screen bg-canvas px-5 py-10">
	<div class="mx-auto max-w-[980px]">
		<a href="/" class="mb-8 flex items-center gap-2.5">
			<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607]"><Icon name="feather" size={15} /></span>
			<span class="font-display text-[20px]">Scriptora</span>
			<span class="chip chip-gold ml-1">Enterprise</span>
		</a>

		<div class="mb-8 flex items-center gap-3">
			{#each steps as s, i}
				<div class="flex items-center gap-2">
					<span class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold {i <= step ? 'bg-gold text-[#201607]' : 'border border-line text-faint'}">
						{#if i < step}<Icon name="check" size={11} />{:else}{i + 1}{/if}
					</span>
					<span class="text-[11.5px] {i <= step ? 'text-ink' : 'text-faint'}">{s}</span>
				</div>
				{#if i < steps.length - 1}<span class="h-px w-8 bg-line"></span>{/if}
			{/each}
		</div>

		<div class="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
			<div class="card p-6 sm:p-8">
				{#if step === 0}
					<p class="eyebrow">Step 1 — Workspace</p>
					<h1 class="mt-2 font-display text-[30px] leading-tight">Set up your publishing house.</h1>
					<p class="mt-2 text-[13px] text-muted">This becomes the byline on invoices, exports and the audit trail.</p>
					<div class="mt-6 space-y-4">
						<div>
							<label class="label" for="company">Workspace name</label>
							<input id="company" class="input" bind:value={company} />
						</div>
						<div>
							<label class="label" for="bill">Billing email</label>
							<input id="bill" class="input" type="email" bind:value={email} />
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label class="label" for="seats">Seats</label>
								<select id="seats" class="select">
									<option>10 seats — included</option>
									<option>25 seats — contact sales</option>
									<option>50 seats — contact sales</option>
								</select>
							</div>
							<div>
								<label class="label" for="region">Data region</label>
								<select id="region" class="select">
									<option>US East</option>
									<option>EU West</option>
									<option>UK</option>
								</select>
							</div>
						</div>
					</div>
					<div class="mt-7 flex justify-end">
						<button class="btn btn-primary" onclick={() => (step = 1)}>Continue to plan <Icon name="arrow-right" size={14} /></button>
					</div>
				{:else if step === 1}
					<p class="eyebrow">Step 2 — Plan</p>
					<h1 class="mt-2 font-display text-[30px] leading-tight">One enterprise subscription.</h1>
					<p class="mt-2 text-[13px] text-muted">Every feature. Every agent. Every export. No usage tiers or per-book charges.</p>
					<div class="mt-6 rounded-xl border border-gold/25 bg-gold/[0.05] p-5">
						<div class="flex items-baseline justify-between">
							<div>
								<p class="text-[12px] font-medium text-gold">Scriptora Enterprise</p>
								<p class="text-[10.5px] text-faint">Annual · billed once</p>
							</div>
							<p class="font-display text-[34px] text-ink">${PLAN_PRICE.toLocaleString()}</p>
						</div>
						<div class="mt-4 grid gap-2 border-t border-gold/15 pt-4 sm:grid-cols-2">
							{#each included as f}<span class="flex items-start gap-2 text-[11.5px] text-muted"><Icon name="check" size={12} class="mt-0.5 shrink-0 text-teal" />{f}</span>{/each}
						</div>
					</div>
					<div class="mt-5">
						<label class="label" for="card">Card on file (demo)</label>
						<div class="relative">
							<input id="card" class="input pr-20" bind:value={card} />
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-faint">Visa</span>
						</div>
						<p class="mt-1.5 text-[10px] text-faint">Simulated checkout. No charge is made in this build.</p>
					</div>
					<div class="mt-7 flex items-center justify-between">
						<button class="btn btn-ghost" onclick={() => (step = 0)}><Icon name="arrow-left" size={14} /> Back</button>
						<button class="btn btn-primary" onclick={() => (step = 2)}>Review activation <Icon name="arrow-right" size={14} /></button>
					</div>
				{:else}
					<p class="eyebrow">Step 3 — Confirm</p>
					<h1 class="mt-2 font-display text-[30px] leading-tight">Ready to open the studio.</h1>
					<p class="mt-2 text-[13px] text-muted">You can invite your team and connect providers from Settings after activation.</p>
					<div class="mt-6 divide-y divide-line rounded-xl border border-line">
						{#each [['Workspace', company], ['Billing email', email], ['Plan', 'Enterprise — annual'], ['Seats', '10 included'], ['Due today', `$${PLAN_PRICE.toLocaleString()}.00`], ['Renewal', new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })]] as [k, v]}
							<div class="flex items-center justify-between px-4 py-3">
								<span class="text-[11.5px] text-faint">{k}</span>
								<span class="text-[12px] text-ink">{v}</span>
							</div>
						{/each}
					</div>
					<div class="mt-5 rounded-lg border border-line bg-white/[0.02] p-3.5">
						<p class="flex items-start gap-2 text-[11px] leading-relaxed text-muted"><Icon name="shield" size={14} class="mt-0.5 shrink-0 text-teal" /> Your manuscripts are never used to train models. You retain full copyright and may export or delete all project data at any time.</p>
					</div>
					<div class="mt-7 flex items-center justify-between">
						<button class="btn btn-ghost" onclick={() => (step = 1)} disabled={activating}><Icon name="arrow-left" size={14} /> Back</button>
						<button class="btn btn-primary btn-lg" onclick={activate} disabled={activating}>
							{#if activating}<Icon name="loader" size={15} class="animate-spin" /> Activating…{:else}Activate & enter studio <Icon name="arrow-right" size={15} />{/if}
						</button>
					</div>
				{/if}
			</div>

			<aside class="space-y-4">
				<div class="card p-5">
					<p class="text-[10px] uppercase tracking-[0.14em] text-faint">What you are buying</p>
					<p class="mt-2 font-display text-[19px] leading-snug text-ink">A production line, not a prompt.</p>
					<p class="mt-2 text-[11.5px] leading-relaxed text-muted">Scriptora replaces the stack of disconnected tools authors use to plan, draft, edit, design and package a book.</p>
					<div class="mt-4 space-y-2.5">
						{#each [['book', 'Unlimited manuscripts'], ['agents', '12 specialists'], ['palette', 'Cover design system'], ['file', '6 export formats'], ['shield', 'Approval & audit']] as [icon, label]}
							<div class="flex items-center gap-2.5 text-[11.5px] text-muted"><Icon name={icon} size={14} class="text-gold" />{label}</div>
						{/each}
					</div>
				</div>
				<div class="card p-5">
					<p class="text-[10px] uppercase tracking-[0.14em] text-faint">Included in the demo</p>
					<div class="mt-3 space-y-3">
						{#each [['The Cartographer of Silence', '48,620 words · editing'], ['The Attention Ledger', '4 chapters · drafting'], ['Salt Houses', 'series blueprint'], ['The Long Inventory', 'published']] as [t, d]}
							<div>
								<p class="text-[11.5px] text-ink">{t}</p>
								<p class="text-[10px] text-faint">{d}</p>
							</div>
						{/each}
					</div>
				</div>
			</aside>
		</div>
	</div>
</div>
