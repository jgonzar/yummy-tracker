<script lang="ts">
	import RideCard from '$lib/components/RideCard.svelte';

	let { data } = $props();
</script>

{#if data.viajes.length === 0}
	<div class="flex flex-col items-center justify-center py-24 gap-2">
		<p class="text-base-content/30 text-sm">No hay carreras pagadas</p>
	</div>
{:else}
	<div class="space-y-3 pb-8">
		{#each data.viajes as viaje (viaje.id)}
			<RideCard {viaje} tasa={data.tasa?.tasa ?? null} />
		{/each}
	</div>
{/if}
