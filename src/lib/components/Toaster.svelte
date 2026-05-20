<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

<div class="toast toast-top toast-end z-50" style="top: 4.5rem">
	{#each toastStore.toasts as toast (toast.id)}
		<div
			class="alert shadow-md"
			class:alert-success={toast.type === 'success'}
			class:alert-error={toast.type === 'error'}
			in:fly={{ y: -12, duration: 200 }}
			out:fly={{ y: -12, duration: 150 }}
		>
			<span class="text-sm">{toast.message}</span>
		</div>
	{/each}
</div>
