<script lang="ts">
import { onMount } from 'svelte';
import Icon from '$lib/components/Icon.svelte';
import { SITE } from '$lib/config';

type Overview = {
	workspaces: number;
	books: number;
	words: number;
	runs: number;
	liveRuns: number;
	revenue: number;
	booksList: Array<Record<string, unknown>>;
	members: Array<Record<string, unknown>>;
	recent: Array<Record<string, unknown>>;
	at: string;
};

type AdminData = {
	admin: { email: string };
	overview: Overview | null;
	error?: string;
	integrations: Record<string, boolean>;
	site: {
		origin: string;
		publicUrl: string;
		convexUrl: string;
		convexSiteUrl: string;
		ewinHub: string;
		ewinEcosystem: string;
		googleCallback: string;
		githubCallback: string;
	};
	at: string;
};

let phase = $state<'loading' | 'login' | 'ready'>('loading');
let email = $state('Omaledanjumaogale@gmail.com');
let password = $state('');
let busy = $state(false);
let error = $state('');
let notice = $state('');
let data = $state<AdminData | null>(null);
let tab = $state<'workspaces' | 'books' | 'endpoints'>('workspaces');

const integrationMeta: Record<string, { label: string; detail: string }> = {
	convex: { label: 'Convex', detail: 'Live studio state + HTTP actions' },
	agnes: { label: 'AGNES AI', detail: 'agnes-3.0-flash chapter generation' },
	resend: { label: 'Resend', detail: 'Transactional email delivery' },
	google: { label: 'Google OAuth', detail: 'Workspace sign-in' },
	github: { label: 'GitHub OAuth', detail: 'Developer sign-in' },
	r2: { label: 'R2 assets', detail: 'Covers, exports, manuscripts' },
	ewin: { label: 'E-WIN hub', detail: 'Ecosystem registration + SSO links' },
	workersAi: { label: 'Cloudflare API', detail: 'Pages + R2 management token' }
};

const str = (value: unknown) => (value === null || value === undefined ? '—' : String(value));
const num = (value: unknown) => (typeof value === 'number' ? value.toLocaleString() : '0');
const money = (value: unknown) => `$${Number(value ?? 0).toLocaleString()}`;
const when = (value: unknown) => {
	if (!value) return '—';
	const date = new Date(String(value));
	return Number.isNaN(date.valueOf())
		? String(value)
		: date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

async function load() {
	phase = 'loading';
	try {
		const res = await fetch('/api/admin/data', { credentials: 'same-origin' });
		if (res.status === 401) {
			phase = 'login';
			return;
		}
		data = (await res.json()) as AdminData;
		phase = 'ready';
		if (data.error) error = data.error;
	} catch {
		phase = 'login';
		error = 'Unable to reach the admin endpoint.';
	}
}

async function signIn() {
	if (!email.includes('@') || !password) {
		error = 'Enter the super-admin email and password.';
		return;
	}
	busy = true;
	error = '';
	try {
		const res = await fetch('/api/admin/login', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const body = (await res.json()) as { error?: string };
		if (!res.ok) throw new Error(body.error ?? 'Sign-in failed');
		password = '';
		await load();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Sign-in failed';
	} finally {
		busy = false;
	}
}

async function signOut() {
	await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
	data = null;
	phase = 'login';
}

async function testEmail() {
	busy = true;
	notice = '';
	error = '';
	try {
		const res = await fetch('/api/admin/email-test', { method: 'POST', credentials: 'same-origin' });
		const body = (await res.json()) as { error?: string };
		if (!res.ok) throw new Error(body.error ?? 'Email failed');
		notice = 'Deliverability test accepted by Resend.';
	} catch (err) {
		error = err instanceof Error ? err.message : 'Email failed';
	} finally {
		busy = false;
	}
}

async function copy(value: string) {
	try {
		await navigator.clipboard.writeText(value);
		notice = 'Copied to clipboard.';
	} catch {
		error = 'Clipboard unavailable in this browser.';
	}
}

onMount(load);
</script>

<svelte:head>
	<title>Super admin — Scriptora</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-canvas text-ink">
	<div class="pointer-events-none fixed inset-0 overflow-hidden">
		<div class="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-gold/[0.05] blur-[110px]"></div>
		<div class="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-teal/[0.035] blur-[130px]"></div>
	</div>

	<header class="relative z-10 flex h-[64px] items-center gap-3 border-b border-line bg-canvas/80 px-5 backdrop-blur-xl sm:px-8">
		<a href="/" class="flex items-center gap-2.5">
			<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-deep text-[#201607]">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
			</span>
			<span class="font-display text-[19px]">Scriptora</span>
		</a>
		<span class="chip chip-gold !px-2 !py-0.5 !text-[9px]">SUPER ADMIN</span>
		<div class="ml-auto flex items-center gap-2">
			<a class="btn btn-ghost btn-sm hidden sm:inline-flex" href={SITE.ewinHub} target="_blank" rel="noreferrer">
				<Icon name="arrow-up-right" size={13} /> E-WIN hub
			</a>
			{#if phase === 'ready'}
				<button class="btn btn-ghost btn-sm" onclick={load}><Icon name="refresh" size={13} /> Refresh</button>
				<button class="btn btn-secondary btn-sm" onclick={signOut}>Sign out</button>
			{/if}
		</div>
	</header>

	<main class="relative z-10 mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8">
		{#if phase === 'loading'}
			<div class="flex min-h-[60vh] items-center justify-center">
				<div class="flex items-center gap-3 text-[13px] text-muted"><Icon name="loader" size={17} class="animate-spin" /> Checking admin session…</div>
			</div>
		{:else if phase === 'login'}
			<div class="mx-auto mt-10 max-w-[420px]">
				<p class="eyebrow">Operator access</p>
				<h1 class="mt-2 font-display text-[34px] leading-tight">Super admin console.</h1>
				<p class="mt-2 text-[13px] leading-relaxed text-muted">Live Convex workspaces, AGNES generation, email delivery and ecosystem wiring for <span class="text-ink">scriptora.ewinproject.org</span>.</p>

				<form class="card mt-7 space-y-4 p-5" onsubmit={(event) => { event.preventDefault(); void signIn(); }}>
					<div>
						<label class="label" for="admin-email">Super-admin email</label>
						<input id="admin-email" class="input" type="email" bind:value={email} autocomplete="username" />
					</div>
					<div>
						<label class="label" for="admin-password">Password</label>
						<input id="admin-password" class="input" type="password" bind:value={password} autocomplete="current-password" placeholder="••••••••••••" />
					</div>
					{#if error}<p class="text-[11.5px] text-danger">{error}</p>{/if}
					<button class="btn btn-primary w-full" type="submit" disabled={busy}>
						{#if busy}<Icon name="loader" size={15} class="animate-spin" /> Verifying…{:else}Enter console <Icon name="arrow-right" size={15} />{/if}
					</button>
					<p class="text-[10.5px] leading-relaxed text-faint">Session is signed with <span class="mono">ADMIN_SESSION_SECRET</span>, expires after 12 hours and never exposes provider keys to the browser.</p>
				</form>
				<a href="/" class="mt-5 inline-flex items-center gap-1.5 text-[11.5px] text-faint hover:text-gold"><Icon name="arrow-left" size={13} /> Back to Scriptora</a>
			</div>
		{:else if data}
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="eyebrow">Operations · live</p>
					<h1 class="mt-1.5 font-display text-[32px] leading-tight">Ecosystem control room</h1>
					<p class="mt-1.5 text-[12.5px] text-muted">Signed in as {data.admin.email} · snapshot {when(data.at)}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<a class="btn btn-secondary btn-sm" href="/app"><Icon name="library" size={13} /> Open studio</a>
					<a class="btn btn-secondary btn-sm" href={SITE.ewinEcosystem} target="_blank" rel="noreferrer"><Icon name="arrow-up-right" size={13} /> Ecosystem</a>
					<button class="btn btn-primary btn-sm" onclick={testEmail} disabled={busy}><Icon name="mail" size={13} /> Send test email</button>
				</div>
			</div>

			{#if error}<div class="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-[12px] text-danger">{error}</div>{/if}
			{#if notice}<div class="mt-4 rounded-lg border border-teal/30 bg-teal/10 px-4 py-2.5 text-[12px] text-teal">{notice}</div>{/if}

			<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{#each [
					['Workspaces', data.overview?.workspaces ?? 0, 'live keys'],
					['Books', data.overview?.books ?? 0, 'in catalogue'],
					['Words', data.overview?.words ?? 0, 'drafted'],
					['Runs', data.overview?.runs ?? 0, `${data.overview?.liveRuns ?? 0} live`],
					['Revenue', money(data.overview?.revenue), 'annualised'],
					['Plan', '$5k', 'enterprise/yr']
				] as row}
					<div class="card p-4">
						<p class="text-[10px] uppercase tracking-[0.12em] text-faint">{row[0]}</p>
						<p class="mt-1.5 font-display text-[24px] leading-none text-ink">{typeof row[1] === 'number' ? num(row[1]) : row[1]}</p>
						<p class="mt-1 text-[10px] text-faint">{row[2]}</p>
					</div>
				{/each}
			</div>

			<div class="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
				<section class="card p-5">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="font-display text-[19px]">Integration matrix</h2>
							<p class="mt-0.5 text-[11px] text-faint">Server-side presence, checked at request time.</p>
						</div>
						<span class="chip chip-teal !text-[9px]">{Object.values(data.integrations).filter(Boolean).length}/{Object.keys(data.integrations).length} ready</span>
					</div>
					<div class="mt-4 grid gap-2 sm:grid-cols-2">
						{#each Object.entries(data.integrations) as [key, on]}
							<div class="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
								<span class="flex h-6 w-6 items-center justify-center rounded-md {on ? 'bg-teal/15 text-teal' : 'bg-danger/10 text-danger'}">
									<Icon name={on ? 'check' : 'x'} size={12} />
								</span>
								<span class="min-w-0">
									<span class="block text-[12px] font-medium text-ink">{integrationMeta[key]?.label ?? key}</span>
									<span class="block truncate text-[10px] text-faint">{integrationMeta[key]?.detail ?? 'Configured server-side'}</span>
								</span>
								<span class="ml-auto text-[9px] uppercase tracking-[0.1em] {on ? 'text-teal' : 'text-danger'}">{on ? 'Live' : 'Off'}</span>
							</div>
						{/each}
					</div>
				</section>

				<section class="card p-5">
					<h2 class="font-display text-[19px]">Domain & routes</h2>
					<p class="mt-0.5 text-[11px] text-faint">Public surface and OAuth callbacks.</p>
					<div class="mt-4 space-y-2.5">
						{#each [
							['Public studio', data.site.publicUrl],
							['Convex site', data.site.convexSiteUrl || 'not configured'],
							['Google callback', data.site.googleCallback],
							['GitHub callback', data.site.githubCallback],
							['E-WIN hub', data.site.ewinHub]
						] as row}
							<div class="rounded-lg border border-line bg-white/[0.02] px-3 py-2">
								<p class="text-[9.5px] uppercase tracking-[0.1em] text-faint">{row[0]}</p>
								<div class="mt-0.5 flex items-center gap-2">
									<code class="min-w-0 flex-1 truncate text-[10.5px] text-muted">{row[1]}</code>
									<button class="text-faint hover:text-gold" onclick={() => copy(row[1])} aria-label={`Copy ${row[0]}`}><Icon name="copy" size={12} /></button>
								</div>
							</div>
						{/each}
					</div>
				</section>
			</div>

			<section class="card mt-4 overflow-hidden">
				<div class="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
					<h2 class="font-display text-[19px]">Live data</h2>
					<div class="ml-auto flex gap-1 rounded-lg border border-line p-0.5">
						{#each [['workspaces', 'Workspaces'], ['books', 'Books'], ['endpoints', 'Runtime']] as [id, label]}
							<button
								class="rounded-md px-2.5 py-1 text-[10.5px] transition {tab === id ? 'bg-white/[0.07] text-ink' : 'text-faint hover:text-muted'}"
								onclick={() => (tab = id as typeof tab)}
							>{label}</button>
						{/each}
					</div>
				</div>

				{#if tab === 'workspaces'}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-[11.5px]">
							<thead class="border-b border-line text-[9.5px] uppercase tracking-[0.1em] text-faint">
								<tr>
									<th class="px-4 py-2.5 font-medium">Workspace</th>
									<th class="px-4 py-2.5 font-medium">Owner</th>
									<th class="px-4 py-2.5 font-medium">Books</th>
									<th class="px-4 py-2.5 font-medium">Updated</th>
									<th class="px-4 py-2.5 font-medium">Key</th>
								</tr>
							</thead>
							<tbody>
								{#each data.overview?.members ?? [] as member}
									<tr class="border-b border-line/70 last:border-0 hover:bg-white/[0.02]">
										<td class="px-4 py-3 text-ink">{str(member.workspace)}</td>
										<td class="px-4 py-3"><span class="text-ink">{str(member.name)}</span><br /><span class="text-[10px] text-faint">{str(member.email)}</span></td>
										<td class="px-4 py-3 mono text-muted">{num(member.books)}</td>
										<td class="px-4 py-3 text-faint">{when(member.updatedAt)}</td>
										<td class="px-4 py-3"><code class="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-faint">{str(member.workspaceKey)}</code></td>
									</tr>
								{:else}
									<tr><td colspan="5" class="px-4 py-8 text-center text-[12px] text-faint">No live workspaces yet. Sign in through Google or GitHub to create the first one.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else if tab === 'books'}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-[11.5px]">
							<thead class="border-b border-line text-[9.5px] uppercase tracking-[0.1em] text-faint">
								<tr>
									<th class="px-4 py-2.5 font-medium">Title</th>
									<th class="px-4 py-2.5 font-medium">Author</th>
									<th class="px-4 py-2.5 font-medium">Stage</th>
									<th class="px-4 py-2.5 font-medium">Words</th>
									<th class="px-4 py-2.5 font-medium">Quality</th>
								</tr>
							</thead>
							<tbody>
								{#each data.overview?.booksList ?? [] as book}
									<tr class="border-b border-line/70 last:border-0 hover:bg-white/[0.02]">
										<td class="px-4 py-3 text-ink">{str(book.title)}</td>
										<td class="px-4 py-3 text-muted">{str(book.author)}</td>
										<td class="px-4 py-3"><span class="chip !px-1.5 !py-0.5 !text-[9px]">{str(book.stage)}</span></td>
										<td class="px-4 py-3 mono text-muted">{num(book.wordCount)}</td>
										<td class="px-4 py-3 text-gold">{str(book.quality)}</td>
									</tr>
								{:else}
									<tr><td colspan="5" class="px-4 py-8 text-center text-[12px] text-faint">No books in live workspaces yet.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="grid gap-2 p-4 sm:grid-cols-2">
						{#each [
							['Convex cloud', data.site.convexUrl || 'PUBLIC_CONVEX_URL not set'],
							['Convex HTTP', data.site.convexSiteUrl || 'PUBLIC_CONVEX_SITE_URL not set'],
							['Request origin', data.site.origin],
							['Snapshot', when(data.overview?.at ?? data.at)]
						] as row}
							<div class="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
								<p class="text-[9.5px] uppercase tracking-[0.1em] text-faint">{row[0]}</p>
								<p class="mt-1 break-all text-[11px] text-muted">{row[1]}</p>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<p class="mt-6 text-center text-[10px] text-faint">Super-admin console · keys stay server-side · <a class="hover:text-gold" href="/api/health" target="_blank">runtime health</a></p>
		{/if}
	</main>
</div>
