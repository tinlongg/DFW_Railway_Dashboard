<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';


	/** @type {HTMLDivElement} */
	let mapContainer;
    /** @type {any} */
	let map;

	onMount(async () => {
		// Import the module directly without using .default to make the editor happy

		const maplibregl = await import('maplibre-gl');
        maplibregl.setWorkerUrl(maplibreWorkerUrl);

    /** @type {HTMLDivElement} */
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
			center: [-96.3344, 30.6280], // College Station, TX
			zoom: 9
		});
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div bind:this={mapContainer} style="width: 100%; height: 100%;"></div>
