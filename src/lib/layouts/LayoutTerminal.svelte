<script lang="ts">
	import { derived } from 'svelte/store';
	import { transcriptEntries, type TranscriptEntry } from '$lib/stores/audio';
	import { claims, claimFilter, claimStats, type Claim, type ClaimFilter } from '$lib/stores/claims';

	type LogItem =
		| { kind: 'transcript'; timestamp: number; text: string }
		| { kind: 'claim'; timestamp: number; claim: Claim };

	const STATUS_SYM: Record<string, string> = {
		pending: '⋯',
		verified: '✓',
		false: '✗',
		uncertain: '?',
		unverifiable: '~',
	};

	const STATUS_COLOR: Record<string, string> = {
		pending: '#f59e0b',
		verified: '#10b981',
		false: '#ef4444',
		uncertain: '#6b7280',
		unverifiable: '#8b5cf6',
	};

	const log = derived([transcriptEntries, claims, claimFilter], ([$t, $c, $filter]) => {
		const fc = $filter === 'all' ? $c : $c.filter((c) => c.status === $filter);
		const items: LogItem[] = [
			...$t.map((e) => ({ kind: 'transcript' as const, timestamp: e.timestamp, text: e.text })),
			...fc.map((c) => ({ kind: 'claim' as const, timestamp: c.timestamp, claim: c })),
		];
		return items.sort((a, b) => b.timestamp - a.timestamp);
	});

	const filterKeys: { key: ClaimFilter; label: string }[] = [
		{ key: 'all', label: 'all' },
		{ key: 'verified', label: 'ok' },
		{ key: 'false', label: 'ko' },
		{ key: 'pending', label: '...' },
		{ key: 'uncertain', label: 'unk' },
		{ key: 'unverifiable', label: 'n/a' },
	];
</script>

<div class="terminal">
	<div class="term-bar">
		<span class="counters">
			<span style="color:#10b981">{$claimStats.verified}✓</span>
			<span style="color:#ef4444">{$claimStats.false}✗</span>
			<span style="color:#f59e0b">{$claimStats.pending}…</span>
			<span style="color:#6b7280">{$claimStats.uncertain}?</span>
			<span style="color:#8b5cf6">{$claimStats.unverifiable}~</span>
		</span>
		<span class="filters">
			{#each filterKeys as f}
				<button class:active={$claimFilter === f.key} onclick={() => claimFilter.set(f.key)}>
					[{f.label}]
				</button>
			{/each}
		</span>
	</div>

	<div class="log-body">
		{#if $log.length === 0}
			<div class="log-line dim">
				<span class="ts">{new Date().toLocaleTimeString()}</span>
				<span class="sym">_</span>
				<span class="msg">waiting for audio input...</span>
			</div>
		{:else}
			{#each $log as item (item.kind + '-' + (item.kind === 'claim' ? item.claim.id : item.timestamp))}
				{#if item.kind === 'transcript'}
					<div class="log-line dim">
						<span class="ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
						<span class="sym">»</span>
						<span class="msg">{item.text}</span>
					</div>
				{:else}
					<div
						class="log-line"
						style="--sc: {STATUS_COLOR[item.claim.status] ?? '#888'}"
					>
						<span class="ts">{new Date(item.timestamp).toLocaleTimeString()}</span>
						<span class="sym" style="color: var(--sc)"
							>{STATUS_SYM[item.claim.status] ?? '?'}</span
						>
						<span class="msg">
							<span class="claim-text" style="color: var(--sc)">"{item.claim.text}"</span>
							{#if item.claim.explanation}
								<span class="expl"> — {item.claim.explanation}</span>
							{/if}
						</span>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.terminal {
		background: #0d0d0f;
		border: 1px solid #1e1e2e;
		border-radius: 8px;
		overflow: hidden;
		font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Courier New', monospace;
	}

	.term-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: #111118;
		border-bottom: 1px solid #1e1e2e;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.counters {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.filters {
		display: flex;
		gap: 0.15rem;
	}

	.filters button {
		background: none;
		border: none;
		color: #555;
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0.1rem 0.25rem;
		transition: color 0.1s;
	}

	.filters button:hover { color: #aaa; }
	.filters button.active { color: #7b7bff; }

	.log-body {
		padding: 0.75rem 1rem;
		max-height: calc(100vh - 260px);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.log-line {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	.ts {
		color: #333;
		font-size: 0.75rem;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.sym {
		flex-shrink: 0;
		width: 1ch;
		text-align: center;
		font-weight: 700;
	}

	.msg {
		color: #888;
		flex: 1;
		word-break: break-word;
	}

	.claim-text {
		font-weight: 500;
	}

	.expl {
		color: #555;
		font-size: 0.8rem;
	}

	.dim .sym { color: #333; }
	.dim .msg { color: #444; font-style: italic; }
</style>
