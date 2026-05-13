<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import AddRideSheet from '$lib/components/AddRideSheet.svelte';
	import RideCard, { type RideData } from '$lib/components/RideCard.svelte';
	import SummaryBar from '$lib/components/SummaryBar.svelte';

	let { data } = $props();
	let showSheet = $state(false);
	let editViaje = $state<RideData | null>(null);
	let hiddenIds = $state(new Set<number>());

	const visibleViajes = $derived(data.viajes.filter((v) => !hiddenIds.has(v.id)));
	const totalUsd = $derived(visibleViajes.reduce((sum, v) => sum + parseFloat(v.precioUsd), 0));

	function openCreate() {
		editViaje = null;
		showSheet = true;
	}

	function handlePaid(id: number) {
		hiddenIds = new Set([...hiddenIds, id]);
		invalidateAll();
	}

	function handleDeleted(id: number) {
		hiddenIds = new Set([...hiddenIds, id]);
		invalidateAll();
	}

	function handleEdit(viaje: RideData) {
		editViaje = viaje;
		showSheet = true;
	}

	async function onSaved() {
		await invalidateAll();
	}
</script>

<SummaryBar count={visibleViajes.length} {totalUsd} />

{#if visibleViajes.length === 0}
	<div class="flex flex-col items-center justify-center py-24 gap-2">
		<p class="text-base-content/30 text-sm">No hay carreras pendientes</p>
	</div>
{:else}
	<div class="space-y-3 pb-24">
		{#each visibleViajes as viaje (viaje.id)}
			<div out:fly={{ x: 400, duration: 300, easing: cubicIn }}>
				<RideCard
					{viaje}
					onPaid={handlePaid}
					onDeleted={handleDeleted}
					onEdit={handleEdit}
				/>
			</div>
		{/each}
	</div>
{/if}

<AddRideSheet bind:open={showSheet} {editViaje} {onSaved} />

<button
	onclick={openCreate}
	class="btn btn-primary btn-circle btn-lg fixed bottom-6 right-6 shadow-lg z-20"
	aria-label="Agregar carrera"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="h-7 w-7"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2.5"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
	</svg>
</button>
