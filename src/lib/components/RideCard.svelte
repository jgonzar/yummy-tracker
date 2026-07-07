<script lang="ts">
	import { untrack } from 'svelte';
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	export type RideData = {
		id: number;
		creadoEn: Date | string;
		pagadoEn?: Date | string | null;
		borradoEn?: Date | string | null;
		conductorNombre: string;
		precioUsd: string | null;
		minutosEspera: number | null;
		notas: string | null;
		clientes: { id: number; nombre: string }[];
		paradas: { id: number; nombre: string }[]; // ordered: [origen, ...stops, destino]
	};

	let {
		viaje,
		tasa = null,
		pending = false,
		onPaid,
		onDeleted,
		onEdit,
		onPriceUpdated,
		onRestore
	}: {
		viaje: RideData;
		tasa?: number | null;
		pending?: boolean;
		onPaid?: (id: number) => void;
		onDeleted?: (id: number) => void;
		onEdit?: (viaje: RideData) => void;
		onPriceUpdated?: (id: number) => void;
		onRestore?: (id: number) => void;
	} = $props();

	// ── price state ───────────────────────────────────────────────────────────
	let paying = $state(false);
	let deleting = $state(false);
	let restoring = $state(false);
	let confirmingDelete = $state(false);
	let editingPrice = $state(false);
	let priceInput = $state('');
	let savingPrice = $state(false);

	let localPriceUsd = $state(viaje.precioUsd);
	$effect(() => {
		const p = viaje.precioUsd;
		untrack(() => { localPriceUsd = p; });
	});

	// ── swipe state ───────────────────────────────────────────────────────────
	const THRESHOLD = 80;
	let swipeEl: HTMLDivElement;
	let swipeX = $state(0);
	let swiping = false; // plain boolean — only used during gesture, no need for reactivity
	let touchStartX = 0;
	let touchStartY = 0;
	let axisLocked = false; // true once we've decided horizontal vs vertical

	const canSwipe = $derived(!!onPaid || !!onDeleted);
	const swipeAction = $derived(swipeX < -THRESHOLD ? 'delete' : swipeX > THRESHOLD ? 'paid' : null);

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		swiping = false;
		axisLocked = false;
		swipeX = 0;
	}

	function handleTouchMove(e: TouchEvent) {
		const dx = e.touches[0].clientX - touchStartX;
		const dy = e.touches[0].clientY - touchStartY;

		if (!axisLocked) {
			if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; // wait for clear intent
			axisLocked = true;
			if (Math.abs(dy) > Math.abs(dx)) return; // vertical — let scroll happen
			swiping = true;
		}

		if (!swiping) return;
		e.preventDefault();

		// Limit travel beyond threshold for a rubber-band feel
		const cap = THRESHOLD + 40;
		swipeX = Math.max(-cap, Math.min(cap, dx));
	}

	function onTouchEnd() {
		if (!swiping) return;
		swiping = false;

		if (swipeX < -THRESHOLD && onDeleted) {
			swipeX = 0;
			deleteRide();
		} else if (swipeX > THRESHOLD && onPaid) {
			swipeX = 0;
			markPaid();
		} else {
			swipeX = 0;
		}
	}

	onMount(() => {
		swipeEl.addEventListener('touchmove', handleTouchMove, { passive: false });
		return () => swipeEl.removeEventListener('touchmove', handleTouchMove);
	});

	// ── deriveds ─────────────────────────────────────────────────────────────
	const canEditPrice = $derived(!fechaPago && !pending);
	const origen = $derived(viaje.paradas[0]?.nombre ?? '—');
	const destino = $derived(viaje.paradas[viaje.paradas.length - 1]?.nombre ?? '—');
	const stops = $derived(viaje.paradas.slice(1, -1).map((p) => p.nombre));

	const precio = $derived(
		localPriceUsd
			? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
					parseFloat(localPriceUsd)
				)
			: null
	);

	const precioVes = $derived(
		tasa && localPriceUsd
			? 'Bs. ' +
					new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
						parseFloat(localPriceUsd) * tasa
					)
			: null
	);

	const fecha = $derived(
		new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
			new Date(viaje.creadoEn)
		)
	);

	const fechaPago = $derived(
		viaje.pagadoEn
			? new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
					new Date(viaje.pagadoEn)
				)
			: null
	);

	const fechaBorrado = $derived(
		viaje.borradoEn
			? new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
					new Date(viaje.borradoEn)
				)
			: null
	);

	// ── actions ───────────────────────────────────────────────────────────────
	function startEditPrice() {
		if (!canEditPrice) return;
		priceInput = localPriceUsd ?? '';
		editingPrice = true;
	}

	function focusAndSelect(node: HTMLInputElement) {
		node.focus();
		node.select();
	}

	async function savePrice() {
		const val = parseFloat(priceInput.replace(',', '.').trim());
		if (isNaN(val) || val < 0) return;
		savingPrice = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ precioUsd: val })
			});
			if (!res.ok) throw new Error();
			localPriceUsd = String(val);
			editingPrice = false;
			onPriceUpdated?.(viaje.id);
		} catch {
			// keep input open
		} finally {
			savingPrice = false;
		}
	}

	async function markPaid() {
		paying = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, { method: 'PATCH' });
			if (!res.ok) throw new Error();
			toastStore.add('Carrera marcada como pagada', 'success');
			onPaid?.(viaje.id);
		} catch {
			toastStore.add('Error al marcar como pagada', 'error');
			paying = false;
		}
	}

	async function deleteRide() {
		deleting = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error();
			toastStore.add('Carrera eliminada', 'success');
			onDeleted?.(viaje.id);
		} catch {
			toastStore.add('Error al eliminar la carrera', 'error');
			deleting = false;
		}
	}

	async function confirmDelete() {
		confirmingDelete = false;
		deleteRide();
	}

	async function restoreRide() {
		restoring = true;
		try {
			const res = await fetch(`/api/viajes/${viaje.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ restore: true })
			});
			if (!res.ok) throw new Error();
			toastStore.add('Carrera restaurada', 'success');
			onRestore?.(viaje.id);
		} catch {
			toastStore.add('Error al restaurar la carrera', 'error');
			restoring = false;
		}
	}
</script>

<!-- Swipe wrapper -->
<div class="relative rounded-2xl overflow-hidden shadow-sm" class:opacity-60={pending}>
	<!-- Swipe background: green (paid) on left, red (delete) on right -->
	{#if swipeX > 10}
		<div class="absolute inset-0 bg-success flex items-center pl-5">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-success-content transition-transform duration-100"
				style="transform: scale({swipeX >= THRESHOLD ? 1.2 : 1})"
				fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>
	{:else if swipeX < -10}
		<div class="absolute inset-0 bg-error flex items-center justify-end pr-5">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-error-content transition-transform duration-100"
				style="transform: scale({swipeX <= -THRESHOLD ? 1.2 : 1})"
				fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
			</svg>
		</div>
	{/if}

	<!-- Card — translates on swipe -->
	<div
		bind:this={swipeEl}
		class="card bg-base-200"
		style="transform: translateX({swipeX}px); transition: {swiping ? 'none' : 'transform 0.25s ease-out'}"
		ontouchstart={canSwipe ? onTouchStart : undefined}
		ontouchend={canSwipe ? onTouchEnd : undefined}
	>
		<div class="card-body p-4 gap-3">

			<!-- Price edit: full-width overlay at top of card when active -->
			{#if editingPrice}
				<div class="flex items-center gap-2">
					<div class="relative flex-1">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 font-medium">$</span>
						<input
							use:focusAndSelect
							type="text"
							bind:value={priceInput}
							inputmode="decimal"
							pattern="^\d*\.?\d*$"
							class="input input-bordered w-full pl-9 text-xl font-bold"
							onkeydown={(e) => {
								if (e.key === 'Enter') savePrice();
								if (e.key === 'Escape') editingPrice = false;
							}}
						/>
					</div>
					<button
						class="btn btn-success btn-square"
						onclick={savePrice}
						disabled={savingPrice}
						aria-label="Guardar precio"
					>
						{#if savingPrice}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							✓
						{/if}
					</button>
					<button
						class="btn btn-ghost btn-square"
						onclick={() => (editingPrice = false)}
						aria-label="Cancelar"
					>
						✕
					</button>
				</div>
			{:else}
				<!-- Header: clients + price display + menu -->
				<div class="flex items-start justify-between gap-2">
					<div class="flex flex-wrap gap-1">
						{#each viaje.clientes as cliente}
							<span class="badge badge-primary badge-sm">{cliente.nombre}</span>
						{/each}
					</div>

					<div class="flex items-start gap-10 shrink-0">
						<div class="flex flex-col">
							{#if precio}
								<button
									class="font-bold text-base"
									class:cursor-default={!canEditPrice}
									onclick={startEditPrice}
									aria-label={canEditPrice ? 'Editar precio' : undefined}
								>
									{precio}
								</button>
							{:else}
								<button class="flex flex-col text-left" onclick={startEditPrice}>
									<span class="text-xs text-warning font-medium leading-tight">Sin precio</span>
									<span class="font-bold text-base text-base-content/40 leading-tight">Pendiente</span>
								</button>
							{/if}
							{#if precioVes}
								<span class="text-xs text-base-content/40">{precioVes}</span>
							{/if}
						</div>

						{#if !fechaPago && !pending}
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
				</div>
			{/if}

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
					<button class="btn btn-ghost btn-xs" onclick={() => (confirmingDelete = false)} disabled={deleting}>
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
			{:else if onRestore}
				<div class="flex items-center justify-between pt-2 border-t border-base-300">
					<span class="text-xs text-base-content/30">Borrado {fechaBorrado}</span>
					<button class="btn btn-warning btn-xs" onclick={restoreRide} disabled={restoring}>
						{#if restoring}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							Restaurar
						{/if}
					</button>
				</div>
			{:else}
				<div class="flex items-center justify-between pt-2 border-t border-base-300">
					<span class="text-xs text-base-content/30">{fecha}</span>
					{#if pending}
						<span class="flex items-center gap-1 text-xs text-base-content/40">
							<span class="loading loading-spinner loading-xs"></span>
							Pendiente
						</span>
					{:else if fechaPago}
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
</div>
