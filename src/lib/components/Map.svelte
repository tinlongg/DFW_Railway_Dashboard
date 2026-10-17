<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import * as maplibregl from 'maplibre-gl';

	let {isDark = false} = $props();
	///** @type {HTMLDivElement} */
	let mapContainer;
    ///** @type {any} */
	let map = $state();

	const darkTrain = "/darkTrain.png";
	const lightTrain = "/lightTrain.png";

	const darkMap = "https://tiles.openfreemap.org/styles/fiord";
	const lightMap = "https://tiles.openfreemap.org/styles/positron";


	async function addDataLayers(){
		if(!map) return;

		const darkTrainPng = await map.loadImage('/darkTrain.png');
		const lightTrainPng = await map.loadImage('/lightTrain.png');
		map.addImage('lightTrain', lightTrainPng.data);
		map.addImage('darkTrain', darkTrainPng.data);
		

		if(!map.getSource('dfw-tracts')){
			map.addSource('dfw-tracts', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/DFW_Census_Tracts_Final_Master/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getSource('dfw_railways')){
			map.addSource('dfw_railways', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/railway_cutoff1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getSource('dfw_station')){
			map.addSource('dfw_station', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/Stations_name2/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getSource('dfw-distance')){
			map.addSource('dfw-distance', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/NewDistanceToStation2/FeatureServer/1/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		if(!map.getLayer('tract-border')){
			map.addLayer({
				'id': 'tract-border',
				'type': 'line',
				'source': 'dfw-tracts',
				'paint': {
					'line-color': '#1f2937',
					'line-width': 1,
					'line-opacity': 0.5
				}
			});
		}

		if(!map.getLayer('distance')){
			map.addLayer({
				'id': 'distance',
				'type': 'line',
				'source': 'dfw-distance',
				'paint': {
					'line-color': 'blue',
					'line-width': 3,
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
					'fill-opacity': 0.50
				}
			});

		}

		if(!map.getLayer('railway-lines')){
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
				'type': 'symbol',
				'source': 'dfw_station',
				'layout': {
					'icon-image': isDark ? 'darkTrain' : 'lightTrain',
					'icon-size': 0.15,
					'icon-allow-overlap': true,
					'icon-ignore-placement': true
				}
				// <a href="https://www.flaticon.com/free-icons/train-stop" title="train stop icons">Train stop icons created by andinur - Flaticon</a>
			});
		}


		
		map.off('click', 'station-name');
		map.on('click', 'station-name', (e) => {
			e.originalEvent._handled = true;

			const features = e.features[0];
			const props = features.properties;

			const stationName = props.stop_name || props.NAME || 'station-name';

			new maplibregl.Popup({offset: 10})
				.setLngLat(e.lngLat)
				.setHTML(`
					<div style="font-family: sans-serif; padding: 4px;">
                		<h3 style="font-weight: bold; margin: 0 0 4px;">${stationName}</h3>
            		</div>
				`)
				.addTo(map);
		});


		

		map.on('mouseenter', 'station-name', () => {
  			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', 'station-name', () => {
  			map.getCanvas().style.cursor = '';
		});


		//map.setLayoutProperty('station-name', 'icon-image', isDark ? 'darkTrain' : 'lightTrain');
	}
	


	onMount(() => {

        maplibregl.setWorkerUrl(maplibreWorkerUrl);


    /** @type {HTMLDivElement} */
		map = new maplibregl.Map({
			container: mapContainer,
			style: isDark ? darkMap: lightMap,
			center: [-97.0377, 32.7802], 
			zoom: 9.75,
			pitch: 0
		});

		map.on('load', async () => {

			await addDataLayers();
		});

	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$effect(() => {
		const theme = isDark;

		if(map && map.isStyleLoaded()){
			map.setStyle(theme ? darkMap : lightMap);

			map.once('style.load', async () => {
				await addDataLayers();
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
