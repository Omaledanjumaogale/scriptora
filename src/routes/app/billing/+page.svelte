<script lang="ts">
import { studio } from '$lib/store.svelte';
import { PLAN_PRICE } from '$lib/seed';
import Icon from '$lib/components/Icon.svelte';
import Progress from '$lib/components/Progress.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';

const ws = $derived(studio.state.workspace);

function downloadInvoice(id: string) {
	const inv = ws.invoices.find((i) => i.id === id);
	if (!inv) return;
	studio.notify(`Invoice ${inv.number} downloaded as PDF`);
}
</script>

<svelte:head><title>Plan & billing — Scriptora</title></svelte:head>

<PageHeader eyebrow="Account" title="One plan. Everything included." description="Enterprise is billed annually. It covers the workspace, ten seats, unlimited books and every specialist, protocol and export format.">
	<span class="chip chip-success"><Icon name="check-circle" size={12} /> {ws.status === 'active' ? 'Active' : ws.status}</span>
	<button class="btn btn-secondary" onclick={() => studio.notify('Billing portal opened in demo mode')}><Icon name="external" size={14} /> Billing portal</button>
</PageHeader>

<div class="grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
	<div class="space-y-5">
		<!-- plan -->
		<div class="card overflow-hidden border-gold/20">
			<div class="bg-gradient-to-br from-gold/[0.08] via-transparent to-transparent p-5 sm:p-6">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div class="flex items-center gap-2">
							<span class="chip chip-gold">Enterprise</span>
							<span class="text-[10.5px] text-faint">Annual subscription</span>
						</div>
						<div class="mt-3 flex items-baseline gap-2">
							<span class="font-display text-[44px] leading-none text-ink">${PLAN_PRICE.toLocaleString()}</span>
							<span class="text-[12px] text-muted">/ year</span>
						</div>
						<p class="mt-1.5 text-[11px] text-faint">Renews {ws.renewal} · {ws.seats} seats · unlimited books</p>
					</div>
					<div class="text-right">
						<p class="text-[9px] uppercase tracking-[0.12em] text-faint">Next invoice</p>
						<p class="mt-1 mono text-[13px] text-ink">${PLAN_PRICE.toLocaleString()}.00</p>
						<p class="mt-0.5 text-[9.5px] text-faint">{ws.renewal}</p>
					</div>
				</div>
				<div class="mt-5 grid gap-2 sm:grid-cols-2">
					{#each ['Unlimited books & series', 'All 12 specialists + 8 protocols', 'Market & keyword intelligence', 'Cover design system', 'EPUB, PDF, DOCX, MD, HTML, TXT, JSON', '10 seats, role permissions', 'Provider routing + cost caps', 'Audit log & approval gates'] as f}
						<span class="flex items-start gap-2 text-[10.5px] text-muted"><Icon name="check" size={12} class="mt-0.5 shrink-0 text-teal" />{f}</span>
					{/each}
				</div>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
				<p class="text-[10px] text-faint">Payment method: Visa ending 4242 · exp 09/29</p>
				<div class="flex gap-2">
					<button class="btn btn-secondary btn-sm" onclick={() => studio.notify('Payment method update opened (demo)')}>Update card</button>
					<button class="btn btn-ghost btn-sm" onclick={() => studio.notify('Plan change requires owner confirmation')}>Change plan</button>
				</div>
			</div>
		</div>

		<!-- usage -->
		<div class="card p-5">
			<div class="flex items-center justify-between">
				<h2 class="font-display text-[19px] text-ink">Usage this cycle</h2>
				<span class="text-[9.5px] text-faint">No overage charges on Enterprise</span>
			</div>
			<div class="mt-4 grid gap-5 sm:grid-cols-3">
				<div>
					<div class="flex justify-between text-[10px]"><span class="text-faint">AI credits</span><span class="mono text-muted">{ws.aiCreditsUsed} / {ws.aiCreditsTotal}</span></div>
					<Progress value={(ws.aiCreditsUsed / ws.aiCreditsTotal) * 100} showLabel />
				</div>
				<div>
					<div class="flex justify-between text-[10px]"><span class="text-faint">Seats</span><span class="mono text-muted">{ws.seatsUsed} / {ws.seats}</span></div>
					<Progress value={(ws.seatsUsed / ws.seats) * 100} tone="teal" showLabel />
				</div>
				<div>
					<div class="flex justify-between text-[10px]"><span class="text-faint">Books this month</span><span class="mono text-muted">{ws.booksThisMonth}</span></div>
					<Progress value={60} tone="violet" showLabel />
				</div>
			</div>
			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				{#each [['Words this month', ws.wordsThisMonth.toLocaleString()], ['Agent runs', String(studio.runs.length)], ['Production spend', `$${studio.runs.reduce((s, r) => s + r.cost, 0).toFixed(2)}`]] as [k, v]}
					<div class="rounded-lg border border-line bg-white/[0.02] p-3">
						<p class="text-[8.5px] uppercase tracking-[0.1em] text-faint">{k}</p>
						<p class="mt-1 font-display text-[20px] text-ink">{v}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- invoices -->
		<div class="card overflow-hidden">
			<div class="border-b border-line px-5 py-3.5">
				<h2 class="font-display text-[18px] text-ink">Invoice history</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[560px] text-left">
					<thead><tr class="border-b border-line text-[8.5px] uppercase tracking-[0.08em] text-faint"><th class="px-5 py-2 font-medium">Invoice</th><th class="px-3 py-2 font-medium">Date</th><th class="px-3 py-2 font-medium">Description</th><th class="px-3 py-2 font-medium">Amount</th><th class="px-3 py-2 font-medium">Status</th><th class="px-5 py-2"></th></tr></thead>
					<tbody>
						{#each ws.invoices as inv}
							<tr class="table-row">
								<td class="mono px-5 py-3 text-[10px] text-ink">{inv.number}</td>
								<td class="px-3 py-3 text-[9.5px] text-faint">{new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
								<td class="px-3 py-3 text-[10px] text-muted">{inv.description}</td>
								<td class="mono px-3 py-3 text-[10px] text-ink">${inv.amount.toLocaleString()}.00</td>
								<td class="px-3 py-3"><span class="chip !px-1.5 !py-0 !text-[8px] chip-success capitalize">{inv.status}</span></td>
								<td class="px-5 py-3 text-right"><button class="text-[9.5px] text-gold hover:underline" onclick={() => downloadInvoice(inv.id)}>PDF</button></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- rail -->
	<div class="space-y-4">
		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">Billing contact</h3>
			<div class="mt-3 space-y-2 text-[10.5px]">
				<p class="text-ink">{studio.user?.name}</p>
				<p class="text-muted">{studio.user?.email}</p>
				<p class="text-faint">Venn & Co. Publishing</p>
				<p class="text-faint">VAT · Not provided</p>
			</div>
			<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={() => studio.notify('Billing details update opened')}>Edit details</button>
		</div>

		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">Seats</h3>
			<div class="mt-3 space-y-2">
				{#each [['Amara Venn', 'Owner'], ['Nadia Okoro', 'Editor'], ['Jonah Hale', 'Author']] as [name, role]}
					<div class="flex items-center justify-between text-[10px]">
						<span class="text-muted">{name}</span><span class="text-faint">{role}</span>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-[9px] text-faint">{ws.seats - ws.seatsUsed} seats available</p>
			<button class="btn btn-secondary btn-sm mt-3 w-full" onclick={() => studio.notify('Invite link copied to clipboard')}>Invite teammate</button>
		</div>

		<div class="card p-5">
			<h3 class="text-[12px] font-semibold text-ink">Enterprise terms</h3>
			<ul class="mt-3 space-y-2 text-[9.5px] leading-relaxed text-muted">
				<li>Annual commitment, billed in advance.</li>
				<li>Cancel before renewal to avoid the next charge.</li>
				<li>Full data export available at any time.</li>
				<li>30-day money-back window for new workspaces.</li>
				<li>DPA and subprocessor list available on request.</li>
			</ul>
			<button class="btn btn-ghost btn-sm mt-3 w-full !text-danger" onclick={() => studio.notify('Cancellation requires owner confirmation — no change made')}>Cancel subscription</button>
		</div>
	</div>
</div>
