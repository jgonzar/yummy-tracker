<script lang="ts">
	import { userState, USERS } from '$lib/stores/user.svelte';
</script>

<div class="navbar bg-base-200 sticky top-0 z-30 shadow-sm">
	<!-- Hamburger -->
	<div class="navbar-start">
		<label for="main-drawer" aria-label="Abrir menú" class="btn btn-ghost btn-circle">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</label>
	</div>

	<!-- App name -->
	<div class="navbar-center">
		<span class="font-bold text-base tracking-wide">Yuumy Track</span>
	</div>

	<!-- User avatar + switch dropdown -->
	<div class="navbar-end">
		<div class="dropdown dropdown-end">
			<button aria-label="Cambiar usuario" class="btn btn-ghost btn-circle avatar placeholder">
				<div class="bg-primary text-primary-content rounded-full w-9 flex items-center justify-center">
					<span class="text-sm font-bold leading-none">{userState.activeUser?.iniciales ?? '?'}</span>
				</div>
			</button>
			<ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box shadow-lg z-50 w-52 p-2 mt-2 gap-1">
				<li class="menu-title text-xs">Cambiar usuario</li>
				{#each USERS as user}
					<li>
						<button
							onclick={() => userState.setUser(user)}
							class:bg-base-300={userState.activeUser?.id === user.id}
						>
							<span class="badge badge-primary badge-sm font-bold">{user.iniciales}</span>
							{user.nombre}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
