<script>
    let { showModal = $bindable(), header, children} = $props();
    let dialog = $state();

    $effect(() => {
        if (showModal) dialog.showModal();
    });
</script>
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog 
    bind:this={dialog}
    onclose={() => (showModal = false)}
    onclick={(e) => {if (e.target === dialog) dialog.close();}}
>
    <div>
        {@render header?.()}

        {@render children?.()}
		<!-- svelte-ignore a11y_autofocus -->
        <button class="hover:cursor-pointer" autofocus onclick={() => dialog.close()}>close modal</button>
    </div>
</dialog>

<style>
    dialog {
        position: fixed;
        inset: 0;
        margin: auto;

        max-width: 32em;
        width: 90%;
        border-radius: 1em;
        border: none;
        padding: 0;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>

