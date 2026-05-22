<script lang="ts">
	let {
		count,
		totalUsd,
		tasa = null,
		stale = false,
		onPayAll
	}: {
		count: number;
		totalUsd: number;
		tasa?: number | null;
		stale?: boolean;
		onPayAll?: () => Promise<void>;
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

	let confirming = $state(false);
	let paying = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	function startConfirm() {
		confirming = true;
		confirmTimer = setTimeout(() => { confirming = false; }, 4000);
	}

	function cancelConfirm() {
		if (confirmTimer) { clearTimeout(confirmTimer); confirmTimer = null; }
		confirming = false;
	}

	async function confirm() {
		cancelConfirm();
		paying = true;
		await onPayAll?.();
		paying = false;
	}
</script>

<div class="card bg-base-200 shadow-sm sticky top-16 z-20 mb-4">
	<div class="card-body p-4 py-3">
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

		{#if onPayAll && count > 0}
			<div class="border-t border-base-300 mt-2 pt-2 flex items-center justify-end">
				{#if confirming}
					<div class="flex items-center gap-2">
						<span class="text-xs text-base-content/50">¿Marcar todas como pagadas?</span>
						<button class="btn btn-ghost btn-xs" onclick={cancelConfirm} disabled={paying}>
							No
						</button>
						<button class="btn btn-success btn-xs" onclick={confirm} disabled={paying}>
							{#if paying}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
								Sí, pagar todo
							{/if}
						</button>
					</div>
				{:else}
					<button
						class="btn btn-ghost btn-xs text-base-content/40"
						onclick={startConfirm}
					>
						Marcar todo pagado
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
