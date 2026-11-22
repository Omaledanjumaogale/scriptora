<script lang="ts">
import type { Book } from '$lib/types';
import { startPipeline, type PipelineKind } from '$lib/pipeline';
import { studio } from '$lib/store.svelte';
import Icon from './Icon.svelte';

interface Props {
	book: Book;
}
let { book }: Props = $props();

const pipelines: { kind: PipelineKind; title: string; body: string; icon: string; cost: string }[] = [
	{ kind: 'blueprint', title: 'Blueprint', body: 'Concept, characters, world, canon and chapter plan.', icon: 'compass', cost: '~$1.40' },
	{ kind: 'full-book', title: 'Full book', body: 'Draft every chapter, then audit, edit and package.', icon: 'sparkles', cost: '~$31.00' },
	{ kind: 'editorial', title: 'Editorial pass', body: 'Line edit, continuity, pacing and AI-ism sweep.', icon: 'feather', cost: '~$5.80' },
	{ kind: 'research', title: 'Market research', body: 'Comps, keywords, pricing, channels and positioning.', icon: 'target', cost: '~$0.90' },
	{ kind: 'design', title: 'Cover sprint', body: 'Three directions, type system and cover package.', icon: 'palette', cost: '~$1.80' },
	{ kind: 'export', title: 'Export package', body: 'Front/back matter, EPUB build and print validation.', icon: 'download', cost: '~$0.60' }
];

function launch(kind: PipelineKind) {
	startPipeline(book.id, kind, { speed: 1.25 });
	studio.notify(`${pipelines.find((p) => p.kind === kind)?.title} pipeline started`);
}
</script>

<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
	{#each pipelines as p}
		<button class="card card-hover flex items-start gap-3 p-3.5 text-left" onclick={() => launch(p.kind)}>
			<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-gold"><Icon name={p.icon} size={15} /></span>
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between">
					<p class="text-[11.5px] font-medium text-ink">{p.title}</p>
					<span class="mono text-[8.5px] text-faint">{p.cost}</span>
				</div>
				<p class="mt-0.5 text-[9.5px] leading-relaxed text-faint">{p.body}</p>
			</div>
		</button>
	{/each}
</div>
