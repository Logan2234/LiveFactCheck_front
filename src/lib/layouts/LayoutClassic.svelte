<script lang="ts">
	import ClaimCard from '$lib/components/ClaimCard.svelte';
	import { transcriptEntries } from '$lib/stores/audio';
	import { claimFilter, claimStats, filteredClaims, type ClaimFilter } from '$lib/stores/claims';

	const filters: { key: ClaimFilter; label: string; icon: string }[] = [
		{ key: 'all', label: 'Tous', icon: '📋' },
		{ key: 'verified', label: 'Vrais', icon: '✅' },
		{ key: 'false', label: 'Faux', icon: '❌' },
		{ key: 'pending', label: 'En cours', icon: '⏳' },
		{ key: 'uncertain', label: 'Incertains', icon: '❓' },
		{ key: 'unverifiable', label: 'Invérifiables', icon: '🔍' },
	];
</script>

<div class="content">
	<section class="transcript-panel">
		<h2>📝 Transcription</h2>
		<div class="transcript-box">
			{#if $transcriptEntries.length === 0}
				<p class="empty">En attente de la transcription...</p>
			{:else}
				{#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
					<div class="entry">
						<span class="time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
						<span class="text">{entry.text}</span>
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<section class="claims-panel">
		<div class="claims-top">
			<h2>📊 Claims ({$claimStats.total})</h2>
			<div class="stats">
				<span class="s verified">✅ {$claimStats.verified}</span>
				<span class="s false">❌ {$claimStats.false}</span>
				<span class="s pending">⏳ {$claimStats.pending}</span>
				<span class="s uncertain">❓ {$claimStats.uncertain}</span>
				<span class="s unverifiable">🔍 {$claimStats.unverifiable}</span>
			</div>
		</div>
		<div class="filters">
			{#each filters as f}
				<button class:active={$claimFilter === f.key} onclick={() => claimFilter.set(f.key)}>
					{f.icon} {f.label}
				</button>
			{/each}
		</div>
		<div class="claims-list">
			{#each $filteredClaims as claim (claim.id)}
				<ClaimCard {claim} />
			{/each}
			{#if $filteredClaims.length === 0}
				<p class="empty">Aucun fait détecté pour le moment...</p>
			{/if}
		</div>
	</section>
</div>

<style>
	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: start;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
	}

	.transcript-box {
		background: #1e1e2e;
		border-radius: 8px;
		padding: 0.75rem;
		max-height: 460px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.entry {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.4rem 0.5rem;
		border-radius: 6px;
		background: #252535;
	}

	.time {
		color: #555;
		font-size: 0.75rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.text {
		color: #ccc;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.claims-top {
		margin-bottom: 0.5rem;
	}

	.stats {
		display: flex;
		gap: 0.75rem;
		font-size: 0.85rem;
		flex-wrap: wrap;
		margin-top: 0.3rem;
	}

	.s.verified { color: #10b981; }
	.s.false { color: #ef4444; }
	.s.pending { color: #f59e0b; }
	.s.uncertain { color: #6b7280; }
	.s.unverifiable { color: #8b5cf6; }

	.filters {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.filters button {
		background: #1e1e2e;
		border: 1px solid #2e2e3e;
		color: #aaa;
		border-radius: 20px;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.filters button:hover { border-color: #555; color: #ddd; }
	.filters button.active { background: #2e2e4e; border-color: #5555aa; color: #fff; }

	.claims-list {
		max-height: 460px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty {
		color: #555;
		text-align: center;
		padding: 2rem;
		margin: 0;
	}

	@media (max-width: 768px) {
		.content { grid-template-columns: 1fr; }
	}
</style>
