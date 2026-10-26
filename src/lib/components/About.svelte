<script>
	let { showModal = $bindable(), dark = false, header, children } = $props();
	let dialog = $state();

	$effect(() => {
		if (showModal) dialog.showModal();
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class={dark ? 'theme-dark' : 'theme-light'}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) dialog.close();
	}}
>
	<div class="body">
		<button class="close" aria-label="Close" onclick={() => dialog.close()}>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
		</button>
		{@render header?.()}
		{@render children?.()}
	</div>
</dialog>

<style>
	dialog {
		position: fixed;
		inset: 0;
		margin: auto;
		max-width: 40em;
		width: calc(100% - 32px);
		max-height: 85vh;
		border-radius: 20px;
		border: 1px solid var(--border);
		padding: 0;
		background: var(--panel);
		color: var(--text);
		box-shadow: 0 30px 60px -12px rgb(0 0 0 / 0.35);
		text-align: left;
	}
	dialog::backdrop {
		background: rgb(10 14 26 / 0.45);
		backdrop-filter: blur(3px);
	}
	.body {
		position: relative;
		padding: 28px 28px 24px;
	}
	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		color: var(--muted);
		cursor: pointer;
		transition: background 0.15s;
	}
	.close:hover {
		background: var(--panel-2);
		color: var(--text);
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from { transform: scale(0.96); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
