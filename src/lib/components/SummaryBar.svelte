<script lang="ts">
	let {
		count,
		totalUsd,
		tasa = null,
		stale = false
	}: {
		count: number;
		totalUsd: number;
		tasa?: number | null;
		stale?: boolean;
	} = $props();

	const totalUsdFmt = $derived(
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)
	);

	const totalVes = $derived(
		tasa
			? 'Bs. ' +
					new Intl.NumberFormat('es-VE', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					}).format(totalUsd * tasa)
			: null
	);
</script>

<div class="sticky top-16 z-20 -mx-4 px-4 py-3 bg-base-200 border-b border-base-300 mb-4">
	<div class="flex items-center justify-around">
		<div class="text-center">
			<p class="text-2xl font-bold tabular-nums">{count}</p>
			<p class="text-xs text-base-content/40 uppercase tracking-wide">Pendientes</p>
		</div>
		<div class="w-px h-8 bg-base-300"></div>
		<div class="text-center">
			<p class="text-2xl font-bold tabular-nums">{totalUsdFmt}</p>
			{#if totalVes}
				<p class="text-sm tabular-nums text-base-content/50">{totalVes}</p>
			{/if}
			<p class="text-xs text-base-content/40 uppercase tracking-wide">Total</p>
			{#if stale}
				<p class="text-xs text-warning/60">tasa de ayer</p>
			{/if}
		</div>
	</div>
</div>
