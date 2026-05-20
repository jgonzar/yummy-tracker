<script lang="ts">
	export type RideData = {
		id: number;
		creadoEn: Date | string;
		pagadoEn?: Date | string | null;
		conductorNombre: string;
		precioUsd: string;
		minutosEspera: number | null;
		notas: string | null;
		clientes: { id: number; nombre: string }[];
		paradas: { id: number; nombre: string }[]; // ordered: [origen, ...stops, destino]
	};

	let {
		viaje,
		tasa = null,
		onPaid,
		onDeleted,
		onEdit
	}: {
		viaje: RideData;
		tasa?: number | null;
		onPaid?: (id: number) => void;
		onDeleted?: (id: number) => void;
		onEdit?: (viaje: RideData) => void;
	} = $props();

	let paying = $state(false);
	let deleting = $state(false);
	let confirmingDelete = $state(false);

	const origen = $derived(viaje.paradas[0]?.nombre ?? '—');
	const destino = $derived(viaje.paradas[viaje.paradas.length - 1]?.nombre ?? '—');
	const stops = $derived(viaje.paradas.slice(1, -1).map((p) => p.nombre));

	const precio = $derived(
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
			parseFloat(viaje.precioUsd)
		)
	);

	const precioVes = $derived(
		tasa
			? 'Bs. ' +
					new Intl.NumberFormat('es-VE', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					}).format(parseFloat(viaje.precioUsd) * tasa)
			: null
	);

	const fecha = $derived(
		new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
			new Date(viaje.creadoEn)
		)
	);

	const fechaPago = $derived(
		viaje.pagadoEn
			? new Intl.DateTimeFormat('es-VE', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}).format(new Date(viaje.pagadoEn))
			: null
	);

	async function markPaid() {
		paying = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, { method: 'PATCH' });
			if (!res.ok) throw new Error();
			onPaid?.(viaje.id);
		} catch {
			paying = false;
		}
	}

	async function confirmDelete() {
		deleting = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error();
			onDeleted?.(viaje.id);
		} catch {
			deleting = false;
			confirmingDelete = false;
		}
	}
</script>

<div class="card bg-base-200 shadow-sm">
	<div class="card-body p-4 gap-3">
		<!-- Header: clients + price + menu -->
		<div class="flex items-start justify-between gap-2">
			<div class="flex flex-wrap gap-1">
				{#each viaje.clientes as cliente}
					<span class="badge badge-primary badge-sm">{cliente.nombre}</span>
				{/each}
			</div>
			<div class="flex flex-col items-end shrink-0">
				<div class="flex items-center gap-0.5">
					<span class="font-bold text-base">{precio}</span>
					{#if !fechaPago}
						<div class="dropdown dropdown-end">
							<button
								tabindex="0"
								class="btn btn-ghost btn-xs btn-circle text-base-content/40"
								aria-label="Opciones"
							>
								•••
							</button>
							<ul
								tabindex="0"
								class="dropdown-content z-50 menu p-1 shadow-lg bg-base-300 rounded-box w-36 mt-1"
							>
								<li>
									<button onclick={() => onEdit?.(viaje)}>Editar</button>
								</li>
								<li>
									<button class="text-error" onclick={() => (confirmingDelete = true)}>
										Eliminar
									</button>
								</li>
							</ul>
						</div>
					{/if}
				</div>
				{#if precioVes}
					<span class="text-xs text-base-content/40">{precioVes}</span>
				{/if}
			</div>
		</div>

		<!-- Route -->
		<div class="text-sm">
			<p class="font-medium text-base-content">{origen}</p>
			{#each stops as stop}
				<p class="text-base-content/50 pl-3 leading-6">↓ {stop}</p>
			{/each}
			<p class="text-base-content/60 leading-6">→ {destino}</p>
		</div>

		<!-- Meta -->
		<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-base-content/40">
			<span>{viaje.conductorNombre}</span>
			{#if viaje.minutosEspera}
				<span>· {viaje.minutosEspera} min espera</span>
			{/if}
		</div>

		{#if viaje.notas}
			<p class="text-xs text-base-content/40 italic">{viaje.notas}</p>
		{/if}

		<!-- Footer -->
		{#if confirmingDelete}
			<div class="flex items-center gap-2 pt-2 border-t border-base-300">
				<span class="text-xs text-error flex-1">¿Eliminar esta carrera?</span>
				<button
					class="btn btn-ghost btn-xs"
					onclick={() => (confirmingDelete = false)}
					disabled={deleting}
				>
					No
				</button>
				<button class="btn btn-error btn-xs" onclick={confirmDelete} disabled={deleting}>
					{#if deleting}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						Sí, eliminar
					{/if}
				</button>
			</div>
		{:else}
			<div class="flex items-center justify-between pt-2 border-t border-base-300">
				<span class="text-xs text-base-content/30">{fecha}</span>
				{#if fechaPago}
					<span class="text-xs text-success/70">Pagado {fechaPago}</span>
				{:else}
					<button class="btn btn-success btn-sm" onclick={markPaid} disabled={paying}>
						{#if paying}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Marcar Pagado
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
