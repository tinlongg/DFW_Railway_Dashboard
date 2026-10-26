<script>
	import { onMount, onDestroy } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import * as maplibregl from 'maplibre-gl';
	import { TRACTS_URL, TRACT_FIELDS } from '#lib/stats.js';

	let {
		isDark = false,
		showTracts = true,
		showRails = true,
		showStations = true,
		showDistance = false,
		showFood = true,
		maxPctNoVeh = 46.4
	} = $props();

	let mapContainer;
	let map = $state();

	const HOME = { center: [-97.0377, 32.7802], zoom: 9.75, pitch: 0, bearing: 0 };

	function resetView() {
		map?.flyTo({ ...HOME, duration: 1200, essential: true });
	}

	const darkMap = 'https://tiles.openfreemap.org/styles/fiord';
	const lightMap = 'https://tiles.openfreemap.org/styles/positron';

	// Low-income & low-access flag, accepting 1 / "1" / true / "Yes"
	const LILA_EXPR = [
		'in',
		['downcase', ['to-string', ['get', 'DD_SRAM_LILATracts_1And10']]],
		['literal', ['1', 'true', 'yes']]
	];

	const FOOD_COLOR = '#f97316';

	let selectedTractId = null;
	let tractPopup = null;

	const fmt = (v, digits = 1) => {
		const n = Number(v);
		return v === null || v === undefined || v === '' || !Number.isFinite(n)
			? '—'
			: n.toLocaleString(undefined, { maximumFractionDigits: digits });
	};
	const money = (v) => {
		const n = Number(v);
		return Number.isFinite(n) && n > 0 ? `$${n.toLocaleString()}` : '—';
	};
	const isLila = (v) => ['1', 'true', 'yes'].includes(String(v ?? '').trim().toLowerCase());
	const escapeHtml = (s) =>
		String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

	function tractPopupHtml(p) {
		const lila = isLila(p.DD_SRAM_LILATracts_1And10);
		const badge = lila
			? `<span style="background:${FOOD_COLOR};color:white;border-radius:999px;padding:1px 8px;font-size:11px;">Food desert (LILA)</span>`
			: `<span style="background:var(--panel-2);color:var(--muted);border-radius:999px;padding:1px 8px;font-size:11px;">Not low-access</span>`;
		const row = (label, value) =>
			`<tr><td style="color:var(--muted);padding:2px 10px 2px 0;">${label}</td><td style="font-weight:600;text-align:right;">${value}</td></tr>`;
		return `
			<div style="min-width:220px;color:var(--text);">
				<div style="font-weight:700;margin-bottom:2px;">Tract ${escapeHtml(p.GEOID ?? '')}</div>
				<div style="color:var(--muted);font-size:12px;margin-bottom:6px;">${escapeHtml(p.County ?? '')}</div>
				${badge}
				<table style="margin-top:8px;font-size:12px;border-collapse:collapse;width:100%;">
					${row('Households', fmt(p.B08201_001E, 0))}
					${row('No vehicle', `${fmt(p.B08201_calc_pctNoVehE)}%`)}
					${row('Median household income', money(p.B19049_001E))}
					${row('People &gt;½ mi from grocery', fmt(p.DD_SRAM_lapophalf, 0))}
					${row('Distance to nearest station', `${fmt(p.Total_Miles, 2)} mi`)}
				</table>
				<div style="color:var(--muted);font-size:11px;margin-top:6px;">Click again to clear the route line.</div>
			</div>`;
	}

	async function addDataLayers() {
		if (!map) return;

		if (!map.hasImage('trainMarker')) {
			const circleThick = await map.loadImage('/circleThick.png');
			if (!map.hasImage('trainMarker')) map.addImage('trainMarker', circleThick.data, { sdf: true });
		}

		if (!map.getSource('dfw-tracts')) {
			map.addSource('dfw-tracts', {
				type: 'geojson',
				data: `${TRACTS_URL}?where=1%3D1&outFields=${TRACT_FIELDS}&geometryPrecision=7&f=geojson`
			});
		}
		if (!map.getSource('dfw_railways')) {
			map.addSource('dfw_railways', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/railway_cutoff1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
			});
		}
		if (!map.getSource('dfw_station')) {
			map.addSource('dfw_station', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/Stations_name2/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
				// Group stations that sit close together until you zoom in
				cluster: true,
				clusterRadius: 20,
				clusterMaxZoom: 15
			});
		}
		if (!map.getSource('dfw-distance')) {
			map.addSource('dfw-distance', {
				type: 'geojson',
				data: 'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/NewDistanceToStation2/FeatureServer/1/query?where=1%3D1&outFields=*&f=geojson'
			});
		}

		// Layer order (bottom → top): fills, food-desert overlay, borders, lines, points
		if (!map.getLayer('tract-poly')) {
			map.addLayer({
				id: 'tract-poly',
				type: 'fill',
				source: 'dfw-tracts',
				layout: { visibility: showTracts ? 'visible' : 'none' },
				paint: { 'fill-color': '#93c5fd', 'fill-opacity': 0.25 }
			});
		}
		if (!map.getLayer('lila-fill')) {
			map.addLayer({
				id: 'lila-fill',
				type: 'fill',
				source: 'dfw-tracts',
				filter: LILA_EXPR,
				layout: { visibility: showFood ? 'visible' : 'none' },
				paint: { 'fill-color': FOOD_COLOR, 'fill-opacity': 0.18 }
			});
		}
		if (!map.getLayer('tract-border')) {
			map.addLayer({
				id: 'tract-border',
				type: 'line',
				source: 'dfw-tracts',
				layout: { visibility: showTracts ? 'visible' : 'none' },
				paint: { 'line-color': isDark ? '#cbd5e1' : '#1f2937', 'line-width': 1, 'line-opacity': 0.4 }
			});
		}
		if (!map.getLayer('lila-outline')) {
			map.addLayer({
				id: 'lila-outline',
				type: 'line',
				source: 'dfw-tracts',
				filter: LILA_EXPR,
				layout: { visibility: showFood ? 'visible' : 'none' },
				paint: { 'line-color': FOOD_COLOR, 'line-width': 2.5 }
			});
		}
		if (!map.getLayer('distance')) {
			map.addLayer({
				id: 'distance',
				type: 'line',
				source: 'dfw-distance',
				layout: { visibility: showDistance ? 'visible' : 'none' },
				paint: { 'line-color': 'blue', 'line-width': 3, 'line-opacity': 0.5 }
			});
		}
		if (!map.getLayer('railway-lines')) {
			map.addLayer({
				id: 'railway-lines',
				type: 'line',
				source: 'dfw_railways',
				layout: { visibility: showRails ? 'visible' : 'none' },
				paint: { 'line-color': isDark ? '#50BFDC' : '#39355F', 'line-width': 2.5 }
			});
		}
		if (!map.getLayer('station-cluster')) {
			map.addLayer({
				id: 'station-cluster',
				type: 'circle',
				source: 'dfw_station',
				filter: ['has', 'point_count'],
				layout: { visibility: showStations ? 'visible' : 'none' },
				paint: {
					'circle-color': isDark ? '#E9E3D8' : '#5B12ED',
					'circle-radius': ['step', ['get', 'point_count'], 11, 5, 14, 10, 17],
					'circle-stroke-color': isDark ? '#121829' : '#ffffff',
					'circle-stroke-width': 2
				}
			});
		}
		if (!map.getLayer('station-cluster-count')) {
			map.addLayer({
				id: 'station-cluster-count',
				type: 'symbol',
				source: 'dfw_station',
				filter: ['has', 'point_count'],
				layout: {
					visibility: showStations ? 'visible' : 'none',
					'text-field': ['get', 'point_count_abbreviated'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12,
					'text-allow-overlap': true
				},
				paint: { 'text-color': isDark ? '#121829' : '#ffffff' }
			});
		}
		if (!map.getLayer('station-name')) {
			map.addLayer({
				id: 'station-name',
				type: 'symbol',
				source: 'dfw_station',
				filter: ['!', ['has', 'point_count']],
				layout: {
					'icon-image': 'trainMarker',
					// Small at the regional view, full size once zoomed into a neighborhood
					'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.045, 12, 0.065, 15, 0.09],
					'icon-allow-overlap': true,
					'icon-ignore-placement': true,
					visibility: showStations ? 'visible' : 'none'
				},
				paint: {
					'icon-color': isDark ? '#E9E3D8' : '#5B12ED'
				}
			});
		}

		applyNoVehStyle();
		restoreSelection();
	}

	function restoreSelection() {
		if (!map?.getLayer('distance') || !selectedTractId) return;
		map.setFilter('distance', ['==', ['to-string', ['get', 'From_GEOID']], String(selectedTractId)]);
		map.setPaintProperty('distance', 'line-color', '#FB21F3');
		map.setLayoutProperty('distance', 'visibility', 'visible');
	}

	function clearSelection() {
		selectedTractId = null;
		if (!map?.getLayer('distance')) return;
		map.setFilter('distance', null);
		map.setPaintProperty('distance', 'line-color', 'blue');
		map.setLayoutProperty('distance', 'visibility', showDistance ? 'visible' : 'none');
	}

	// Handlers are registered once per map (they survive setStyle)
	function registerHandlers() {
		map.on('click', 'station-name', (e) => {
			e.originalEvent._handled = true;
			const props = e.features[0].properties;
			const stationName = props.stop_name || props.NAME || 'Station';
			new maplibregl.Popup({ offset: 10 })
				.setLngLat(e.lngLat)
				.setHTML(
					`<div style="padding:4px;color:var(--text);"><h3 style="font-weight:bold;margin:0;">${escapeHtml(stationName)}</h3></div>`
				)
				.addTo(map);
		});

		map.on('click', 'station-cluster', async (e) => {
			e.originalEvent._handled = true;
			const feature = e.features[0];
			const zoom = await map
				.getSource('dfw_station')
				.getClusterExpansionZoom(feature.properties.cluster_id);
			map.easeTo({ center: feature.geometry.coordinates, zoom: zoom + 0.5 });
		});

		map.on('click', 'tract-poly', (e) => {
			if (e.originalEvent._handled) return;
			const props = e.features[0].properties;
			const clickedTract = props.GEOID;
			if (!clickedTract) return;

			tractPopup?.remove();

			if (selectedTractId === clickedTract) {
				clearSelection();
				return;
			}
			selectedTractId = clickedTract;
			restoreSelection();

			tractPopup = new maplibregl.Popup({ offset: 6, maxWidth: '300px' })
				.setLngLat(e.lngLat)
				.setHTML(tractPopupHtml(props))
				.addTo(map);
		});

		const interLayers = ['station-name', 'station-cluster', 'tract-poly'];
		map.on('mouseenter', interLayers, () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', interLayers, () => (map.getCanvas().style.cursor = ''));
	}

	function toggleLayers(layerId, isVisible) {
		if (map && map.getLayer(layerId)) {
			map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
		}
	}

	function applyNoVehStyle() {
		if (!map?.getLayer('tract-poly')) return;
		const threshold = Number(maxPctNoVeh);
		const value = ['to-number', ['get', 'B08201_calc_pctNoVehE']];
		if (threshold <= 0) {
			map.setPaintProperty('tract-poly', 'fill-color', '#93c5fd');
			map.setPaintProperty('tract-poly', 'fill-opacity', 0.25);
		} else {
			map.setPaintProperty('tract-poly', 'fill-color', ['step', value, '#93c5fd', threshold, '#2563eb']);
			map.setPaintProperty('tract-poly', 'fill-opacity', ['step', value, 0.15, threshold, 0.7]);
		}
	}

	onMount(() => {
		maplibregl.setWorkerUrl(maplibreWorkerUrl);
		map = new maplibregl.Map({
			container: mapContainer,
			style: isDark ? darkMap : lightMap,
			...HOME
		});
		map.on('load', async () => {
			registerHandlers();
			await addDataLayers();
		});
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$effect(() => {
		const targetStyle = isDark ? darkMap : lightMap;
		if (map && map.isStyleLoaded()) {
			map.setStyle(targetStyle);
			map.once('style.load', async () => {
				await addDataLayers();
			});
		}
	});

	$effect(() => {
		const tracts = showTracts;
		const rails = showRails;
		const stations = showStations;
		const distance = showDistance;
		const food = showFood;

		if (map && map.isStyleLoaded()) {
			toggleLayers('tract-border', tracts);
			toggleLayers('tract-poly', tracts);
			toggleLayers('railway-lines', rails);
			toggleLayers('station-name', stations);
			toggleLayers('station-cluster', stations);
			toggleLayers('station-cluster-count', stations);
			toggleLayers('lila-fill', food);
			toggleLayers('lila-outline', food);
			// A selected tract keeps its route line visible regardless of the toggle
			toggleLayers('distance', distance || selectedTractId !== null);
		}
	});

	$effect(() => {
		maxPctNoVeh;
		if (map && map.isStyleLoaded()) applyNoVehStyle();
	});
</script>

<div bind:this={mapContainer} class="mapContainer" style="width: 100%; height: 100%; border-radius: 1em;"></div>

<button
	onclick={resetView}
	title="Reset map view"
	aria-label="Reset map view"
	class="absolute top-4 right-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-full border border-(--border) bg-(--panel)/90 px-3 py-2 text-xs font-semibold text-(--text) shadow-(--shadow) backdrop-blur transition hover:bg-(--panel-2)"
>
	<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
	Reset view
</button>
