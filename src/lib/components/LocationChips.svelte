<script lang="ts">
	import type { FormLocation } from './LocationSelect.svelte';

	const QUICK_LOCATIONS = ['El Rocío', 'El Limón', 'Rosalito', 'La Redoma', 'Fresco Market'];

	let {
		value = null,
		onSelect
	}: {
		value?: FormLocation | null;
		onSelect: (loc: FormLocation) => void;
	} = $props();
</script>

<div class="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
	{#each QUICK_LOCATIONS as nombre}
		<button
			type="button"
			class="badge badge-sm shrink-0 cursor-pointer transition-colors"
			class:badge-primary={value?.nombre === nombre}
			class:badge-outline={value?.nombre !== nombre}
			onclick={() => onSelect({ id: null, nombre })}
		>
			{nombre}
		</button>
	{/each}
</div>
