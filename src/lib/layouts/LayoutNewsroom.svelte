<script lang="ts">
	import { derived } from 'svelte/store';
	import ClaimCard from '$lib/components/ClaimCard.svelte';
	import { transcriptEntries, type TranscriptEntry } from '$lib/stores/audio';
	import { claims, claimFilter, type Claim, type ClaimFilter } from '$lib/stores/claims';

	type FeedItem =
		| { kind: 'transcript'; timestamp: number; entry: TranscriptEntry }
		| { kind: 'claim'; timestamp: number; claim: Claim };

	const feed = derived([transcriptEntries, claims, claimFilter], ([$t, $c, $filter]) => {
		const fc = $filter === 'all' ? $c : $c.filter((c) => c.status === $filter);
		const items: FeedItem[] = [
			...$t.map((e) => ({ kind: 'transcript' as const, timestamp: e.timestamp, entry: e })),
			...fc.map((c) => ({ kind: 'claim' as const, timestamp: c.timestamp, claim: c })),
		];
		return items.sort((a, b) => b.timestamp - a.timestamp);
	});

	const filters: { key: ClaimFilter; label: string; icon: string }[] = [
		{ key: 'all', label: 'Tous', icon: '📋' },
		{ key: 'verified', label: 'Vrais', icon: '✅' },
		{ key: 'false', label: 'Faux', icon: '❌' },
		{ key: 'pending', label: 'En cours', icon: '⏳' },
		{ key: 'uncertain', label: 'Incertains', icon: '❓' },
		{ key: 'unverifiable', label: 'Invérifiables', icon: '🔍' },
	];
</script>

<div class="newsroom">
	<div class="filters">
		{#each filters as f}
			<button class:active={$claimFilter === f.key} onclick={() => claimFilter.set(f.key)}>
				{f.icon} {f.label}
			</button>
		{/each}
	</div>

	<div class="feed">
		{#if $feed.length === 0}
			<p class="empty">En attente de la transcription...</p>
		{:else}
			{#each $feed as item (item.kind + '-' + (item.kind === 'claim' ? item.claim.id : item.timestamp))}
				{#if item.kind === 'transcript'}
					<div class="feed-transcript">
						<span class="time">{new Date(item.timestamp).toLocaleTimeString()}</span>
						<span class="text">📝 {item.entry.text}</span>
					</div>
				{:else}
					<div class="feed-claim">
						<ClaimCard claim={item.claim} />
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.newsroom {
		max-width: 680px;
		margin: 0 auto;
	}

	.filters {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
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

	.feed {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: calc(100vh - 220px);
		overflow-y: auto;
	}

	.feed-transcript {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: #181826;
		border-left: 3px solid #2e2e3e;
	}

	.time {
		color: #444;
		font-size: 0.75rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.text {
		color: #777;
		font-size: 0.85rem;
		line-height: 1.5;
		font-style: italic;
	}

	.feed-claim {
		/* ClaimCard handles its own styling */
	}

	.empty {
		color: #555;
		text-align: center;
		padding: 3rem;
		margin: 0;
	}
</style>
