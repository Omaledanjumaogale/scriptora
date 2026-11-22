<script lang="ts">
import { studio } from '$lib/store.svelte';
import { download } from '$lib/export';
import Icon from '$lib/components/Icon.svelte';
import PageHeader from '$lib/components/PageHeader.svelte';
import Avatar from '$lib/components/Avatar.svelte';

let tab = $state<'profile' | 'workspace' | 'providers' | 'team' | 'data'>('profile');
let name = $state(studio.user?.name ?? '');
let email = $state(studio.user?.email ?? '');
let wsName = $state(studio.state.workspace.name);
let inviteName = $state('');
let inviteEmail = $state('');
let inviteRole = $state('Editor');
let saved = $state(false);

function saveProfile() {
	if (!studio.user) return;
	studio.user.name = name;
	studio.user.email = email;
	studio.user.initials = name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
	studio.persist();
	saved = true;
	studio.notify('Profile saved');
	setTimeout(() => (saved = false), 2000);
}

function saveWorkspace() {
	studio.state.workspace.name = wsName;
	studio.persist();
	studio.notify('Workspace updated');
}

function toggleProvider(id: string) {
	const p = studio.state.workspace.providers.find((x) => x.id === id);
	if (!p) return;
	p.connected = !p.connected;
	p.lastUsed = p.connected ? new Date().toISOString() : p.lastUsed;
	studio.persist();
	studio.notify(`${p.name} ${p.connected ? 'connected' : 'disconnected'}`);
}

function invite() {
	if (!inviteEmail.includes('@')) {
		studio.notify('Enter a valid email to invite.', 'error');
		return;
	}
	studio.inviteMember(inviteName, inviteEmail, inviteRole);
	studio.notify(`Invitation sent to ${inviteEmail}`);
	inviteName = '';
	inviteEmail = '';
}

function exportAll() {
	download('scriptora-workspace-export.json', JSON.stringify(studio.state, null, 2), 'application/json');
	studio.notify('Workspace archive downloaded');
}

function resetDemo() {
	if (confirm('Reset the workspace to the original demo catalogue? Local changes will be lost.')) {
		localStorage.removeItem('scriptora.workspace.v1');
		location.reload();
	}
}
</script>

<svelte:head><title>Settings — Scriptora</title></svelte:head>

<PageHeader eyebrow="Workspace" title="Settings" description="Identity, providers, team and data controls. Secrets are not stored in this demo build; connect real providers through a server-side secret manager.">
	{#if saved}<span class="chip chip-success"><Icon name="check" size={11} /> Saved</span>{/if}
	<button class="btn btn-primary" onclick={saveProfile}>Save changes</button>
</PageHeader>

<div class="grid gap-5 lg:grid-cols-[190px_1fr]">
	<nav class="flex gap-1 overflow-x-auto lg:flex-col">
		{#each [['profile', 'Profile', 'users'], ['workspace', 'Workspace', 'grid'], ['providers', 'Providers', 'server'], ['team', 'Team', 'users'], ['data', 'Data & privacy', 'shield']] as [k, l, icon]}
			<button class="nav-link whitespace-nowrap {tab === k ? 'active' : ''}" onclick={() => (tab = k as typeof tab)}><Icon name={icon} size={15} />{l}</button>
		{/each}
	</nav>

	<div class="space-y-5">
		{#if tab === 'profile'}
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Your profile</h2>
				<p class="mt-0.5 text-[10.5px] text-faint">Appears on approvals, comments and the audit trail.</p>
				<div class="mt-4 flex items-center gap-4">
					<Avatar name={name} initials={studio.user?.initials} hue={studio.user?.avatarHue} size={56} />
					<div>
						<button class="btn btn-secondary btn-sm" onclick={() => studio.notify('Avatar upload is disabled in demo')}>Change avatar</button>
						<p class="mt-1.5 text-[9px] text-faint">PNG or JPG, up to 2 MB.</p>
					</div>
				</div>
				<div class="mt-5 grid gap-4 sm:grid-cols-2">
					<div><label class="label" for="n">Full name</label><input id="n" class="input" bind:value={name} /></div>
					<div><label class="label" for="e">Email</label><input id="e" class="input" type="email" bind:value={email} /></div>
				</div>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div><label class="label" for="role">Role</label><input id="role" class="input" value="Owner" disabled /></div>
					<div><label class="label" for="tz">Timezone</label><select id="tz" class="select"><option>America/New_York</option><option>Europe/London</option><option>Africa/Lagos</option></select></div>
				</div>
			</div>
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Notifications</h2>
				<div class="mt-3 space-y-2.5">
					{#each [['Agent run complete', true], ['Human gate requires decision', true], ['Continuity finding raised', true], ['Weekly production digest', false], ['Billing receipts', true]] as [label, on]: [string, boolean]}
						<label class="flex items-center justify-between rounded-md border border-line bg-white/[0.02] px-3 py-2.5">
							<span class="text-[10.5px] text-muted">{label}</span>
							<input type="checkbox" checked={on === true} class="h-3.5 w-3.5 accent-[#e0b872]" />
						</label>
					{/each}
				</div>
			</div>
		{:else if tab === 'workspace'}
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Workspace</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div><label class="label" for="w">Name</label><input id="w" class="input" bind:value={wsName} /></div>
					<div><label class="label" for="plan">Plan</label><input id="plan" class="input" value="Enterprise · $5,000 / year" disabled /></div>
					<div><label class="label" for="region">Data region</label><select id="region" class="select"><option>US East</option><option>EU West</option><option>UK</option></select></div>
					<div><label class="label" for="lang">Default language</label><select id="lang" class="select"><option>English (US)</option><option>English (UK)</option><option>French</option><option>Spanish</option></select></div>
				</div>
				<div class="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
					<p class="text-[9px] uppercase tracking-[0.1em] text-faint">Workspace ID</p>
					<p class="mono mt-1 text-[10px] text-muted">{studio.state.workspace.id}</p>
				</div>
				<div class="mt-4 flex justify-end"><button class="btn btn-primary" onclick={saveWorkspace}>Save workspace</button></div>
			</div>
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Defaults</h2>
				<div class="mt-3 grid gap-4 sm:grid-cols-2">
					<div><label class="label" for="dm">Drafting model</label><select id="dm" class="select"><option>studio-prose-1</option><option>claude-sonnet-4-5</option><option>gpt-5</option></select></div>
					<div><label class="label" for="da">Default autonomy</label><select id="da" class="select"><option>Supervised</option><option>Copilot</option><option>Autonomous</option></select></div>
				</div>
			</div>
		{:else if tab === 'providers'}
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Model providers</h2>
				<p class="mt-0.5 text-[10.5px] text-faint">Route agents to any provider. Keys would live in a server-side secret manager in production.</p>
				<div class="mt-4 space-y-2">
					{#each studio.state.workspace.providers as p}
						<div class="rounded-lg border border-line bg-white/[0.02] p-3">
							<div class="flex flex-wrap items-center gap-3">
								<span class="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-panel text-[9px] font-semibold uppercase text-gold">{p.name.slice(0, 2)}</span>
								<div class="min-w-0 flex-1">
									<p class="text-[11.5px] text-ink">{p.name}</p>
									<p class="truncate text-[9px] text-faint">{p.models.join(' · ')}</p>
								</div>
								{#if p.connected}
									<span class="chip chip-teal !text-[8.5px]">Connected</span>
									<button class="btn btn-secondary btn-sm" onclick={() => toggleProvider(p.id)}>Disconnect</button>
								{:else}
									<button class="btn btn-primary btn-sm" onclick={() => toggleProvider(p.id)}>Connect</button>
								{/if}
							</div>
							{#if p.connected && p.id !== 'scriptora'}
								<div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
									<input class="input !py-1.5 !text-[10px]" type="password" placeholder="API key (not stored in demo)" />
									<button class="btn btn-secondary btn-sm" onclick={() => studio.notify('Key validated in demo mode')}>Test key</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Routing policy</h2>
				<div class="mt-3 space-y-2 text-[10.5px]">
					{#each [['Drafting', 'studio-prose-1'], ['Editing', 'studio-editor-1'], ['Research', 'studio-research-1'], ['Design', 'studio-design-1'], ['Fallback', 'claude-sonnet-4-5']] as [k, v]}
						<div class="flex items-center justify-between"><span class="text-faint">{k}</span><span class="mono text-muted">{v}</span></div>
					{/each}
				</div>
			</div>
		{:else if tab === 'team'}
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Team</h2>
				<p class="mt-0.5 text-[10.5px] text-faint">{studio.state.workspace.seatsUsed} of {studio.state.workspace.seats} seats used.</p>
				<div class="mt-4 divide-y divide-line">
					{#each [{ name: studio.user?.name ?? 'Amara Venn', email: studio.user?.email ?? '', role: 'Owner' }, { name: 'Nadia Okoro', email: 'nadia@venn.co', role: 'Editor' }, { name: 'Jonah Hale', email: 'jonah@venn.co', role: 'Author' }] as m}
						<div class="flex items-center gap-3 py-3">
							<Avatar name={m.name} size={30} hue={38} />
							<div class="min-w-0 flex-1"><p class="truncate text-[11px] text-ink">{m.name}</p><p class="truncate text-[9.5px] text-faint">{m.email}</p></div>
							<span class="chip !text-[8.5px]">{m.role}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Invite a teammate</h2>
				<div class="mt-3 grid gap-3 sm:grid-cols-3">
					<input class="input" placeholder="Name" bind:value={inviteName} />
					<input class="input" placeholder="Email" bind:value={inviteEmail} />
					<select class="select" bind:value={inviteRole}><option>Editor</option><option>Author</option><option>Viewer</option></select>
				</div>
				<button class="btn btn-primary mt-3" onclick={invite}>Send invitation</button>
			</div>
		{:else}
			<div class="card p-5">
				<h2 class="font-display text-[19px] text-ink">Data & privacy</h2>
				<p class="mt-0.5 text-[10.5px] text-faint">Your manuscripts are yours. Scriptora does not train on workspace content.</p>
				<div class="mt-4 space-y-2">
					{#each [['Manuscript storage', 'Local-first in this build; Convex sync when configured'], ['Model training', 'Never — no workspace content is used for training'], ['Subprocessors', 'Provider selected per agent; see routing policy'], ['Retention', 'Until you delete the project or workspace'], ['Data residency', 'US East (demo)']] as [k, v]}
						<div class="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5">
							<p class="text-[9px] uppercase tracking-[0.1em] text-faint">{k}</p>
							<p class="mt-0.5 text-[10.5px] text-muted">{v}</p>
						</div>
					{/each}
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<button class="btn btn-secondary" onclick={exportAll}><Icon name="download" size={14} /> Export all data</button>
					<button class="btn btn-secondary" onclick={() => studio.notify('Deletion request logged — owner confirmation required')}>Delete workspace</button>
				</div>
			</div>
			<div class="card border-danger/20 p-5">
				<h2 class="font-display text-[19px] text-ink">Danger zone</h2>
				<p class="mt-1 text-[10.5px] leading-relaxed text-muted">Reset the local demo workspace to its original catalogue. This removes books, runs and settings you created in this browser.</p>
				<button class="btn btn-danger mt-3" onclick={resetDemo}><Icon name="trash" size={14} /> Reset demo workspace</button>
			</div>
		{/if}
	</div>
</div>
