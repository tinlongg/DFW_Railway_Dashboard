<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import * as maplibregl from 'maplibre-gl';

	let {isDark = false,
		showTracts = true,
		showRails = true,
		showStations = true,
		showDistance = false,
		maxPctNoVeh = 46.4,
	} = $props();
	///** @type {HTMLDivElement} */
	let mapContainer;
    ///** @type {any} */
	let map = $state();
	

	const darkMap = "https://tiles.openfreemap.org/styles/fiord";
	const lightMap = "https://tiles.openfreemap.org/styles/positron";


	async function addDataLayers(){
		if(!map) return;

		const circleThick = await map.loadImage('/circleThick.png');
		map.addImage('trainMarker', circleThick.data, {sdf: true});
		

		if(!map.getSource('dfw-tracts')){
			map.addSource('dfw-tracts', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/DFW_Census_Tracts_Final_Master/FeatureServer/0/query?where=1%3D1&outFields=GEOID,ALAND,State,County,B08201_001E,B08201_002E,B08201_calc_pctNoVehE,B19049_001E,DD_SRAM_LILATracts_1And10,DD_SRAM_lapophalf,From0_ORIG_FID,Total_Miles&geometryPrecision=7&f=geojson'
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
				'layout': { 'visibility': showTracts ? 'visible' : 'none' },
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
				'layout': {
					'visibility': showDistance ? 'visible' : 'none',
				},
				'paint': {
					'line-color': 'blue',
					'line-width': 3,
					'line-opacity': 0.5,
				}
			});
		}


		if(!map.getLayer('tract-poly')){
			map.addLayer({
				'id': 'tract-poly',
				'type': 'fill',
				'source': 'dfw-tracts',
				'layout': { 'visibility': showTracts ? 'visible' : 'none' },
				'paint': {
					'fill-color': '#2563eb',
					'fill-opacity': 0.2
				}
			});

		}

		if(!map.getLayer('railway-lines')){
			map.addLayer({
				'id': 'railway-lines',
				'type': 'line',
				'source': 'dfw_railways',
				'layout': { 'visibility': showRails ? 'visible' : 'none' },
				'paint': { 
					'line-color': isDark ? '#50BFDC' : '#39355F', 
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
					'icon-image': 'trainMarker', //isDark ? 'darkTrain' : 'lightTrain',
					'icon-size': 0.08,
					'icon-allow-overlap': true,
					'icon-ignore-placement': true,
					'visibility': showStations ? 'visible' : 'none',
				},
				'paint': {
					'icon-color': isDark ? '#E9E3D8' : '#5B12ED',
				}
				// <a href="https://www.flaticon.com/free-icons/train-stop" title="train stop icons">Train stop icons created by andinur - Flaticon</a>
			});
		}


		//Station name for funsies
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
		//Tract clicker
		let selectedTractId = null;
		map.off('click', 'tract-poly');
		map.on('click', 'tract-poly', (e) => {
			e.originalEvent._handled = true;

    		const features = e.features[0];
    		const props = features.properties;
    		const clickedTract = props.GEOID;

    		if (!clickedTract) return;

    		map.setLayoutProperty('distance', 'visibility', 'visible');

    		if (selectedTractId === clickedTract) {
        		// Clicked the active tract again: reset filter to show no lines
       			map.setFilter('distance', null);
        		selectedTractId = null;
				map.setLayoutProperty('distance', 'visibility', 'none');
				map.setPaintProperty('distance', 'line-color', 'blue');
    		} else {
        		// Clicked a different tract: show only this line
        		map.setFilter('distance', ['==', ['to-string', ['get', 'From_GEOID']], String(clickedTract)]);
				map.setPaintProperty('distance', 'line-color', '#FB21F3');
        		selectedTractId = clickedTract;
    		}
		});



		const inter_layers = ['station-name', 'tract-poly'];

		map.on('mouseenter', inter_layers, () => {
  			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', inter_layers, () => {
  			map.getCanvas().style.cursor = '';
		});


	}
	
	function toggleLayers(layerId, isVisible){
		if (map && map.getLayer(layerId)){
			map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
		}
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
    // Only track isDark here
    const targetStyle = isDark ? darkMap : lightMap;

    // untrack or guard to ensure it only fires when the style URL actually changes
    if (map && map.isStyleLoaded()) {
        map.setStyle(targetStyle);

        map.once('style.load', async () => {
            await addDataLayers();
        });
    }
});

    // Handle Button Visibility Toggles
    $effect(() => {
        const tracts = showTracts;
        const rails = showRails;
        const stations = showStations;
        const distance = showDistance;

        if (map && map.isStyleLoaded()) {
            toggleLayers('tract-border', tracts);
            toggleLayers('tract-poly', tracts);
            toggleLayers('railway-lines', rails);
            toggleLayers('station-name', stations);
            toggleLayers('distance', distance);
        }
    });

	$effect(() => {
		const threshold = Number(maxPctNoVeh);
		
		if (map && map.isStyleLoaded() && map.getLayer('tract-poly')) {
        if (threshold <= 0) {
            // Reset to flat default light blue and subtle opacity across all tracts
            map.setPaintProperty('tract-poly', 'fill-color', '#93c5fd');
            map.setPaintProperty('tract-poly', 'fill-opacity', 0.25);
        } else {
            // Apply step expression when the slider is actively filtering (> 0)
            map.setPaintProperty('tract-poly', 'fill-color', [
                'step',
                ['to-number', ['get', 'B08201_calc_pctNoVehE']], 
                '#93c5fd', // Below threshold: soft light blue
                threshold,
                '#2563eb'  // At or above threshold: dark active blue
            ]);

            map.setPaintProperty('tract-poly', 'fill-opacity', [
                'step',
                ['to-number', ['get', 'B08201_calc_pctNoVehE']],
                0.15,      // Below threshold: muted
                threshold,
                0.70       // At or above threshold: emphasized
            ]);
        }
    }

	});
</script>

<div bind:this={mapContainer} class="mapContainer" style="width: 100%; height: 100%; border-radius: 1em;"></div>


