<script lang="ts">
import type { AgentRun } from '$lib/types';
import Icon from './Icon.svelte';
import Progress from './Progress.svelte';

interface Props {
	run: AgentRun;
	compact?: boolean;
	onresume?: (id: string) => void;
}
let { run, compact = false, onresume }: Props = $props();

const statusTone: Record<string, string> = {
	running: 'text-gold',
	queued: 'text-violet',
	paused: 'text-warning',
	complete: 'text-teal',
	failed: 'text-danger'
};
const logTone: Record<string, string> = {
	info: 'text-muted',
	ok: 'text-teal',
	warn: 'text-warning',
	error: 'text-danger'
};
</script>

<div class="card overflow-hidden">
	<div class="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
		<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] {statusTone[run.status]}">
			<Icon name={run.status === 'complete' ? 'check-circle' : run.status === 'paused' ? 'pause' : run.status === 'failed' ? 'alert-triangle' : 'loader'} size={15} class={run.status === 'running' ? 'animate-spin' : ''} />
		</span>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-[12px] font-medium text-ink">{run.pipeline}</p>
				<span class="chip !px-1.5 !py-0 !text-[8px] capitalize {run.status === 'paused' ? 'chip-rose' : run.status === 'complete' ? 'chip-success' : 'chip-gold'}">{run.status}</span>
			</div>
			<p class="mt-0.5 truncate text-[9.5px] text-faint">{run.bookTitle} · {run.model} · {new Date(run.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
		</div>
		<div class="flex items-center gap-3 text-[9px] text-faint">
			<span class="mono">${run.cost.toFixed(2)}</span>
			<span class="mono">{Math.round(run.tokens / 1000)}k tok</span>
			<span class="mono w-8 text-right">{run.progress}%</span>
		</div>
		{#if run.status === 'paused' && onresume}
			<button class="btn btn-primary btn-sm" onclick={() => onresume(run.id)}>Resume</button>
		{/if}
	</div>
	{#if run.status === 'running' || run.status === 'paused'}
		<Progress value={run.progress} height={3} tone={run.status === 'paused' ? 'rose' : 'gold'} class="!rounded-none" />
	{/if}

	<div class={compact ? 'px-4 py-3' : 'grid md:grid-cols-[1fr_1.1fr]'}>
		<div class="px-4 py-3">
			<p class="mb-2 text-[8.5px] uppercase tracking-[0.12em] text-faint">Steps</p>
			<div class="space-y-1.5">
				{#each run.steps as step}
					<div class="flex items-start gap-2">
						<span class="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full {step.status === 'done' ? 'bg-teal/15 text-teal' : step.status === 'running' ? 'bg-gold/15 text-gold' : step.status === 'failed' ? 'bg-danger/15 text-danger' : 'border border-line text-faint'}">
							{#if step.status === 'done'}<Icon name="check" size={8} />{:else if step.status === 'running'}<span class="h-1 w-1 animate-ping rounded-full bg-gold"></span>{:else if step.status === 'failed'}<Icon name="x" size={8} />{/if}
						</span>
						<div class="min-w-0 flex-1">
							<p class="text-[10px] {step.status === 'pending' ? 'text-faint' : 'text-ink'}">{step.name}</p>
							{#if step.detail}<p class="text-[9px] text-faint">{step.detail}</p>{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="border-t border-line px-4 py-3 md:border-l md:border-t-0">
			<div class="mb-2 flex items-center justify-between">
				<p class="text-[8.5px] uppercase tracking-[0.12em] text-faint">Live log</p>
				<span class="flex items-center gap-1 text-[8px] text-faint"><span class="h-1 w-1 rounded-full bg-teal"></span> streaming</span>
			</div>
			<div class="max-h-[190px] space-y-1 overflow-y-auto font-mono text-[9px] leading-relaxed">
				{#each run.logs as log}
					<p class={logTone[log.level]}>
						<span class="text-faint">[{new Date(log.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
						{log.message}
					</p>
				{/each}
			</div>
		</div>
	</div>
</div>
