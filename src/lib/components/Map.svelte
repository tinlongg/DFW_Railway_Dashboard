<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

	let {isDark = false} = $props();

	///** @type {HTMLDivElement} */
	let mapContainer;
    ///** @type {any} */
	let map = $state();
	let isMapReady = $state(false);

	const darkMap = "https://tiles.openfreemap.org/styles/fiord";
	const lightMap = "https://tiles.openfreemap.org/styles/positron";

	function addDataLayers(){
		if(!map) return;

		if(!map.getSource('dfw_tracts')){
			map.addSource('dfw_tracts', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/DFW_Census_Tracts_Final_Master/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getSource('dfw_railways')){
			map.addSource('dfw_railways', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/railway_final/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getSource('dfw_station')){
			map.addSource('dfw_station', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/Stations_name2/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getLayer('tract-border')){
			map.addLayer({
				'id': 'tract-border',
				'type': 'line',
				'source': 'dfw_tracts',
				'paint': {
					'line-color': '#1f2937',
					'line-width': 0.85,
					'line-opacity': 0.5
				}
			});
		}

		if(!map.getLayer('tract-poly')){
			map.addLayer({
				'id': 'tract-poly',
				'type': 'fill',
				'source': 'dfw_tracts',
				'paint': {
					'fill-color': '#2563eb',
					'fill-opacity': 0.25
				}
			});

		}

		if(!map.getLayer('railway_lines')){
			map.addLayer({
				'id': 'railway-lines',
				'type': 'line',
				'source': 'dfw_railways',
				'paint': { 
					'line-color': 'black', 
					'line-width': 2.5 
				}
			});
		}

		if(!map.getLayer('station-name')){
			map.addLayer({
				'id': 'station-name',
				'type': 'circle',
				'source': 'dfw_station',
				'paint': {
					'circle-color': 'red',
					'circle-radius': 6
				}
			});
		}

	}
	

	onMount(async () => {
		// Import the module directly without using .default to make the editor happy

		const maplibregl = await import('maplibre-gl');
        maplibregl.setWorkerUrl(maplibreWorkerUrl);


    /** @type {HTMLDivElement} */
		map = new maplibregl.Map({
			container: mapContainer,
			style: isDark ? darkMap: lightMap,
			center: [-97.0377, 32.7802], 
			zoom: 9.75,
			pitch: 0
		});

		map.on('load', () => {
			addDataLayers();
			isMapReady = false;
		});

	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$effect(() => {
		const theme = isDark;

		if(map && map.isStyleLoaded() && (isMapReady = true)){
			map.setStyle(theme ? darkMap : lightMap);

			map.once('style.load', () => {
				addDataLayers();
			});

		}
	});
</script>

<div bind:this={mapContainer} class="mapContainer" style="width: 100%; height: 100%; border-radius: 1em;"></div>

<style>
	.mapContainer {
		width: 80%;
		height: 80%;
		position: absolute;
		top: 5;
		bottom: 5;
	}
</style>
