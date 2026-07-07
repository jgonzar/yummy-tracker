<script lang="ts">
	let {
		count,
		totalUsd,
		tasa = null,
		stale = false,
		onPayAll,
		onExport
	}: {
		count: number;
		totalUsd: number;
		tasa?: number | null;
		stale?: boolean;
		onPayAll?: () => Promise<void>;
		onExport?: () => void;
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

		{#if count > 0 && (onPayAll || onExport)}
			<div class="border-t border-base-300 mt-2 pt-2 flex items-center justify-between">
				{#if onExport}
					<button
						class="btn btn-ghost btn-xs text-base-content/40 gap-1"
						onclick={onExport}
						aria-label="Exportar resumen"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
						Compartir
					</button>
				{:else}
					<span></span>
				{/if}

				{#if onPayAll}
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
				{/if}
			</div>
		{/if}
	</div>
</div>
