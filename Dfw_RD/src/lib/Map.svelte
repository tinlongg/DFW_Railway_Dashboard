<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';


	///** @type {HTMLDivElement} */
	let mapContainer;
    ///** @type {any} */
	let map = $state()

	onMount(async () => {
		// Import the module directly without using .default to make the editor happy

		const maplibregl = await import('maplibre-gl');
        maplibregl.setWorkerUrl(maplibreWorkerUrl);

    /** @type {HTMLDivElement} */
		map = new maplibregl.Map({
			container: mapContainer,
			style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
			center: [-97.0377, 32.8972], 
			zoom: 9,
			pitch: 0
		});

		map.on('load', () => {
			map.addSource('dfw_tracts', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/DFW_Census_Tracts_Final_Master/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});

			map.addSource('dfw_railways', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/railway_final/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});

			map.addSource('dfw_station', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/Stations_name/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});

			map.addLayer({
				'id': 'tract-border',
				'type': 'line',
				'source': 'dfw_tracts',
				'paint': {
					'line-color': '#1f2937',
					'line-width': 0.85,
					'line-opacity': 0.8
				}
			});

			map.addLayer({
				'id': 'tracts-poly',
				'type': 'fill',
				'source': 'dfw_tracts',
				'paint': {
					'fill-color': '#2563eb',
					'fill-opacity': 0.5
				}
			});

			map.addLayer({
				'id': 'railways-line',
				'type': 'line',
				'source': 'dfw_railways',
				'paint': { 
					'line-color': 'black', 
					'line-width': 2.5 
				}
			});

			map.addLayer({
				'id': 'station-name',
				'type': 'circle',
				'source': 'dfw_station',
				'paint': {
					'circle-color': 'red',
					
				}
			})
		});

	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div bind:this={mapContainer} class="mapContainer" style="width: 100%; height: 100%;"></div>

<style>
	.mapContainer {
		width: 100%;
		height: 100vh;
		position: absolute;
		top: 0;
		bottom: 0;
	}
</style>
