<script lang="ts">
	import ClaimCard from '$lib/components/ClaimCard.svelte';
	import { transcriptEntries } from '$lib/stores/audio';
	import { claimFilter, claimStats, filteredClaims, type ClaimFilter } from '$lib/stores/claims';

	const statCards: { key: keyof typeof $claimStats; label: string; icon: string; color: string }[] =
		[
			{ key: 'verified', label: 'Vrais', icon: '✅', color: '#10b981' },
			{ key: 'false', label: 'Faux', icon: '❌', color: '#ef4444' },
			{ key: 'pending', label: 'En cours', icon: '⏳', color: '#f59e0b' },
			{ key: 'uncertain', label: 'Incertains', icon: '❓', color: '#6b7280' },
			{ key: 'unverifiable', label: 'Invérifiables', icon: '🔍', color: '#8b5cf6' },
		];
</script>

<div class="dashboard">
	<div class="stat-row">
		{#each statCards as s}
			<button
				class="stat-tile"
				class:active={$claimFilter === s.key}
				style="--c: {s.color}"
				onclick={() => claimFilter.set($claimFilter === s.key ? 'all' : (s.key as ClaimFilter))}
				title="Filtrer : {s.label}"
			>
				<span class="tile-icon">{s.icon}</span>
				<span class="tile-num" style="color: {s.color}">{$claimStats[s.key]}</span>
				<span class="tile-label">{s.label}</span>
			</button>
		{/each}
	</div>

	<div class="columns">
		<div class="transcript-col">
			<h3>📝 Transcript</h3>
			<div class="transcript-log">
				{#if $transcriptEntries.length === 0}
					<p class="empty">En attente...</p>
				{:else}
					{#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
						<div class="log-line">
							<span class="time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
							<span class="text">{entry.text}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="claims-col">
			<h3>
				Faits
				{#if $claimFilter !== 'all'}<span class="filter-badge">{$claimFilter}</span>{/if}
				<span class="count">({$filteredClaims.length})</span>
			</h3>
			<div class="claims-list">
				{#each $filteredClaims as claim (claim.id)}
					<ClaimCard {claim} />
				{/each}
				{#if $filteredClaims.length === 0}
					<p class="empty">Aucun fait détecté...</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Stat tiles */
	.stat-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.75rem;
	}

	.stat-tile {
		background: #1e1e2e;
		border: 1px solid #2e2e3e;
		border-radius: 10px;
		padding: 1rem 0.75rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.15s;
		position: relative;
		overflow: hidden;
	}

	.stat-tile::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--c);
		opacity: 0.4;
		transition: opacity 0.15s;
	}

	.stat-tile:hover::before,
	.stat-tile.active::before { opacity: 1; }

	.stat-tile.active {
		background: #222235;
		border-color: var(--c);
	}

	.tile-icon { font-size: 1.25rem; }
	.tile-num { font-size: 1.75rem; font-weight: 700; line-height: 1; }
	.tile-label { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }

	/* Two-column layout */
	.columns {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 1.5rem;
		align-items: start;
	}

	h3 {
		font-size: 0.9rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-badge {
		background: #2e2e4e;
		border: 1px solid #5555aa;
		color: #aaa;
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		font-size: 0.7rem;
		text-transform: none;
	}

	.count { color: #555; font-size: 0.8rem; }

	.transcript-log {
		background: #1a1a2a;
		border-radius: 8px;
		padding: 0.75rem;
		max-height: 480px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.log-line {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #1e1e2e;
	}

	.log-line:last-child { border-bottom: none; padding-bottom: 0; }

	.time {
		color: #444;
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
	}

	.text {
		color: #999;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.claims-list {
		max-height: 480px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty {
		color: #444;
		text-align: center;
		padding: 2rem;
		margin: 0;
		font-size: 0.85rem;
	}

	@media (max-width: 900px) {
		.stat-row { grid-template-columns: repeat(3, 1fr); }
		.columns { grid-template-columns: 1fr; }
	}
</style>
