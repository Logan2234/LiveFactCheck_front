<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { clearToken, getToken, token } from "$lib/stores/auth";
  import { onMount } from "svelte";

  let { children } = $props();
  let ready = $state(false);

  onMount(() => {
    if (!getToken()) {
      goto("/login");
    } else {
      ready = true;
    }
  });

  // Redirect out if the token is cleared while on an admin page.
  $effect(() => {
    if (ready && $token === null) goto("/login");
  });

  function logout() {
    clearToken();
    goto("/login");
  }

  const nav = [{ href: "/admin", label: "Test pipeline", icon: "🧪" }];
</script>

{#if ready}
  <div class="shell">
    <aside aria-label="Navigation principale" role="navigation" class="sidebar">
      <div class="brand">
        <span class="logo">🔍</span>
        <div>
          <strong>LiveFactChecker</strong>
          <span class="tag">Admin</span>
        </div>
      </div>
      <nav>
        {#each nav as item}
          <a href={item.href} class:active={page.url.pathname === item.href}>
            <span>{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
      <div class="bottom">
        <a class="app-link" href="/">↩ Application live</a>
        <button onclick={logout}>Déconnexion</button>
      </div>
    </aside>
    <main>
      {@render children()}
    </main>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #121220;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .shell {
    display: flex;
    min-height: 100vh;
  }

  aside {
    width: 230px;
    flex-shrink: 0;
    background: #161624;
    border-right: 1px solid #26263a;
    display: flex;
    flex-direction: column;
    padding: 1.25rem 0.9rem;
    gap: 1.5rem;
  }

  .sidebar {
    width: 15rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0 0.4rem;
  }

  .logo {
    font-size: 1.4rem;
  }

  .brand div {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .brand strong {
    font-size: 0.92rem;
  }

  .tag {
    font-size: 0.68rem;
    color: #7a7ac0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  nav a {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.7rem;
    border-radius: 8px;
    color: #9a9ab0;
    text-decoration: none;
    font-size: 0.88rem;
    transition:
      background 0.15s,
      color 0.15s;
  }

  nav a:hover {
    background: #1e1e30;
    color: #e0e0e0;
  }

  nav a.active {
    background: #26264a;
    color: #fff;
  }

  .bottom {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .app-link {
    color: #6a6a88;
    text-decoration: none;
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem;
  }

  .app-link:hover {
    color: #9a9ac0;
  }

  .bottom button {
    background: transparent;
    border: 1px solid #3a2a3a;
    color: #d08a8a;
    border-radius: 8px;
    padding: 0.5rem;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .bottom button:hover {
    background: rgba(220, 80, 80, 0.12);
    border-color: #7f1d1d;
  }

  main {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }
</style>
