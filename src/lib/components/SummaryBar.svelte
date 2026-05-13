<script lang="ts">
	let {
		count,
		totalUsd
	}: {
		count: number;
		totalUsd: number;
	} = $props();

	const total = $derived(
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)
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
			<p class="text-2xl font-bold tabular-nums">{total}</p>
			<p class="text-xs text-base-content/40 uppercase tracking-wide">Total USD</p>
		</div>
	</div>
</div>
