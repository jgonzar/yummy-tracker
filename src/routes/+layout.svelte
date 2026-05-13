<script lang="ts">
	import '../app.css';
	import { userState } from '$lib/stores/user.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import UserSelect from '$lib/components/UserSelect.svelte';

	let { children } = $props();
	let drawerOpen = $state(false);

	$effect(() => {
		userState.init();
	});
</script>

<!-- User selection overlay — shown until a user is picked -->
{#if !userState.activeUser}
	<UserSelect />
{:else}
	<div class="drawer">
		<input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />

		<div class="drawer-content flex flex-col min-h-screen">
			<NavBar />
			<main class="flex-1 p-4 w-full max-w-lg mx-auto">
				{@render children()}
			</main>
		</div>

		<div class="drawer-side z-40">
			<label for="main-drawer" aria-label="Cerrar menú" class="drawer-overlay"></label>
			<Drawer onNavigate={() => (drawerOpen = false)} />
		</div>
	</div>
{/if}
