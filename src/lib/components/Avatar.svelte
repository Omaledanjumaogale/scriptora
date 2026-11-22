<script lang="ts">
interface Props {
	name?: string;
	initials?: string;
	size?: number;
	hue?: number;
	class?: string;
}
let { name = '', initials = '', size = 32, hue = 38, class: className = '' }: Props = $props();
const ini = $derived(
	initials ||
		name
			.split(' ')
			.filter(Boolean)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() ||
		'?'
);
</script>

<div
	class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[11px] tracking-wide {className}"
	style="width:{size}px;height:{size}px;background:linear-gradient(135deg,hsl({hue} 42% 34%),hsl({(hue + 26) % 360} 38% 22%));color:hsl({hue} 70% 86%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)"
	title={name}
	aria-label={name || ini}
>
	{ini}
</div>
