<script>
	import { onMount } from 'svelte';
	import Map from '#lib/components/Map.svelte';
	import darkMode from '#lib/assets/dark_mode.png';
	import lightMode from '#lib/assets/light_mode.png';
	import About from '#lib/components/About.svelte';
	import { loadTractStats } from '#lib/stats.js';

	let isDark = $state(false);
	let isDisabled = $state(false);

	let showModal = $state(false);
	let showStatModal = $state(false);

	let showTracts = $state(true);
	let showRails = $state(true);
	let showStations = $state(true);
	let showDistance = $state(false);
	let showFood = $state(false);

	let maxPctNoVeh = $state(0);

	let stats = $state(null);
	let statsError = $state('');

	onMount(async () => {
		try {
			stats = await loadTractStats();
		} catch (err) {
			statsError = err?.message || 'Could not load statistics.';
		}
	});

	function toggleTheme() {
		isDisabled = true;
		setTimeout(() => (isDisabled = false), 3500);
		isDark = !isDark;
	}

	const n = (v, d = 1) =>
		v === null || v === undefined || !Number.isFinite(v)
			? '—'
			: v.toLocaleString(undefined, { maximumFractionDigits: d });
	const usd = (v) => (v ? `$${Math.round(v).toLocaleString()}` : '—');

	let sliderMax = $derived(stats?.maxNoVehPct ? Math.ceil(stats.maxNoVehPct * 10) / 10 : 46.4);
	let sliderFill = $derived(`${(Number(maxPctNoVeh) / sliderMax) * 100}%`);

	// [label, description, swatch style, getter, toggle]
	const layers = [
		['Census tracts', 'Shaded by car ownership', 'fill:#93c5fd', () => showTracts, () => (showTracts = !showTracts)],
		['Food deserts', 'Low income, low access', 'outline:#f97316', () => showFood, () => (showFood = !showFood)],
		['Rail lines', 'DART, TEXRail, A-train', 'line:#39355F', () => showRails, () => (showRails = !showRails)],
		['Stations', 'Click for the station name', 'ring:#5B12ED', () => showStations, () => (showStations = !showStations)],
		['Station distance', 'Tract → nearest station', 'line:#2563eb', () => showDistance, () => (showDistance = !showDistance)]
	];
	function commitPct(e) {
		const parsed = parseFloat(String(e.currentTarget.value).replace('%', '').trim());
		if (Number.isFinite(parsed)) {
			maxPctNoVeh = Math.round(Math.min(Math.max(parsed, 0), sliderMax) * 10) / 10;
		}
		e.currentTarget.value = Number(maxPctNoVeh).toFixed(1);
	}

	const navBtn =
		'cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-colors duration-200 active:scale-95';
	const navOff =
		'border-(--border) bg-(--panel) text-(--text) hover:border-(--accent) hover:bg-(--accent-soft) hover:text-(--accent-strong) active:bg-(--accent) active:text-white';
	const navOn = 'border-(--accent) bg-(--accent) text-white';
	const swatch = (spec) => {
		const [kind, color] = spec.split(':');
		return { kind, color };
	};
</script>

<div
	class="{isDark ? 'theme-dark' : 'theme-light'} flex h-screen w-screen flex-col overflow-hidden bg-(--bg) text-(--text) transition-colors duration-300"
>
	<!-- Header -->
	<header class="flex shrink-0 items-center justify-between gap-4 px-6 pt-5 pb-4">
		<div class="flex items-center gap-3">
			<div class="grid h-10 w-10 place-items-center rounded-xl border border-(--border) bg-(--panel) shadow-(--shadow)">
				<img src="/theTrain.png" alt="" class="h-6 w-6 {isDark ? 'invert' : ''}" />
			</div>
			<div>
				<h1 class="text-xl leading-tight font-extrabold tracking-tight">Food & Transportation Access</h1>
				<p class="text-sm text-(--muted)">Dallas–Fort Worth · where groceries are far and cars are few</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="{navBtn} {showStatModal ? navOn : navOff}"
				aria-pressed={showStatModal}
				onclick={() => (showStatModal = true)}>Stand out statistics</button
			>
			<button
				class="{navBtn} {showModal ? navOn : navOff}"
				aria-pressed={showModal}
				onclick={() => (showModal = true)}>About & sources</button
			>
			<button
				disabled={isDisabled}
				class="grid h-10 w-10 place-items-center rounded-full border border-(--border) bg-(--panel) transition hover:bg-(--panel-2) cursor-pointer disabled:cursor-wait disabled:opacity-60"
				aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				title={isDark ? 'Light mode' : 'Dark mode'}
				onclick={toggleTheme}
			>
				{#if isDisabled}
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-(--muted) border-t-transparent"></span>
				{:else}
					<img class="h-5 w-5" src={isDark ? lightMode : darkMode} alt="" />
				{/if}
			</button>
		</div>
	</header>

	<div class="flex min-h-0 flex-1 gap-4 px-6 pb-6">
		<!-- Sidebar -->
		<aside class="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
			<!-- Layers -->
			<section class="rounded-2xl border border-(--border) bg-(--panel) p-4 shadow-(--shadow)">
				<h2 class="mb-2 text-xs font-bold tracking-wider text-(--muted) uppercase">Layers</h2>
				<ul class="-mx-2">
					{#each layers as [label, desc, sw, isOn, toggle] (label)}
						{@const s = swatch(sw)}
						<li>
							<button
								class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-(--panel-2) cursor-pointer"
								role="switch"
								aria-checked={isOn()}
								onclick={toggle}
							>
								<span class="grid h-5 w-5 shrink-0 place-items-center transition {isOn() ? '' : 'opacity-30 grayscale'}">
									{#if s.kind === 'fill'}
										<span class="h-4 w-4 rounded" style="background:{s.color}"></span>
									{:else if s.kind === 'outline'}
										<span class="h-4 w-4 rounded border-2" style="border-color:{s.color};background:{s.color}33"></span>
									{:else if s.kind === 'dot'}
										<span class="h-2.5 w-2.5 rounded-full" style="background:{s.color}"></span>
									{:else if s.kind === 'ring'}
										<span class="h-3.5 w-3.5 rounded-full border-[3px]" style="border-color:{isDark ? '#E9E3D8' : s.color}"></span>
									{:else}
										<span class="h-[3px] w-5 rounded-full" style="background:{label === 'Rail lines' && isDark ? '#50BFDC' : s.color}"></span>
									{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block text-sm font-semibold {isOn() ? '' : 'text-(--muted)'}">{label}</span>
									<span class="block truncate text-xs text-(--muted)">{desc}</span>
								</span>
								<span
									class="relative h-5 w-9 shrink-0 rounded-full transition-colors {isOn() ? 'bg-(--accent)' : 'bg-(--border)'}"
								>
									<span
										class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {isOn() ? 'translate-x-4' : ''}"
									></span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Filter -->
			<section class="rounded-2xl border border-(--border) bg-(--panel) p-4 shadow-(--shadow)">
				<h2 class="mb-1 text-xs font-bold tracking-wider text-(--muted) uppercase">Car ownership filter</h2>
				<p class="mb-3 text-sm">Highlight tracts where at least this share of households has no vehicle.</p>
				<div class="flex items-center gap-3">
					<input
						type="range"
						min="0"
						max={sliderMax}
						step="0.1"
						bind:value={maxPctNoVeh}
						style="--fill:{sliderFill}"
						class="range min-w-0 flex-1"
						aria-label="Minimum percent of households without a vehicle"
					/>
					<label
						class="flex w-16 shrink-0 items-center rounded-md border border-transparent bg-(--accent-soft) px-1.5 py-0.5 text-sm font-bold text-(--accent-strong) transition focus-within:border-(--accent)"
					>
						<input
							type="text"
							inputmode="decimal"
							value={Number(maxPctNoVeh).toFixed(1)}
							onchange={commitPct}
							onfocus={(e) => e.currentTarget.select()}
							onkeydown={(e) => {
								if (e.key === 'Enter') e.currentTarget.blur();
								if (e.key === 'Escape') {
									e.currentTarget.value = Number(maxPctNoVeh).toFixed(1);
									e.currentTarget.blur();
								}
							}}
							class="w-full min-w-0 bg-transparent text-right tabular-nums outline-none"
							aria-label="Minimum percent of households without a vehicle"
						/>
						<span class="pl-0.5">%</span>
					</label>
				</div>
				<div class="mt-2 flex justify-between text-[11px] text-(--muted) tabular-nums">
					<span>0%</span>
					{#if maxPctNoVeh > 0}
						<button class="font-semibold text-(--accent) hover:underline cursor-pointer" onclick={() => (maxPctNoVeh = 0)}>Reset</button>
					{/if}
					<span>{sliderMax}%</span>
				</div>
			</section>

			<p class="px-1 text-xs leading-relaxed text-(--muted)">
				Tip: click any tract to see its numbers and the route to its nearest station.
			</p>
		</aside>

		<!-- Map -->
		<div class="relative min-w-0 flex-1 overflow-hidden rounded-3xl border border-(--border) shadow-(--shadow)">
			<Map {isDark} {showTracts} {showRails} {showStations} {showDistance} {showFood} {maxPctNoVeh} />

			{#if showTracts && maxPctNoVeh > 0}
				<div
					class="absolute bottom-4 left-4 z-10 rounded-xl border border-(--border) bg-(--panel)/90 px-3 py-2 text-xs shadow-(--shadow) backdrop-blur"
				>
					<div class="flex items-center gap-2">
						<span class="h-3 w-4 rounded-sm bg-[#93c5fd]"></span>Below {Number(maxPctNoVeh).toFixed(1)}%
						<span class="ml-2 h-3 w-4 rounded-sm bg-[#2563eb]"></span>At or above
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Statistics modal -->
<About bind:showModal={showStatModal} dark={isDark}>
	{#snippet header()}
		<h2 class="text-2xl font-extrabold tracking-tight">Stand out statistics</h2>
		<p class="mt-1 mb-5 text-sm text-(--muted)">How food-desert tracts compare with the rest of DFW</p>
	{/snippet}

	{#if statsError}
		<p class="text-red-500">Couldn't load the numbers: {statsError}</p>
	{:else if !stats}
		<p class="text-(--muted)">Crunching the numbers…</p>
	{:else}
		<div class="mb-5 grid grid-cols-2 gap-3">
			{#each [
				[stats.lilaCount, `of ${stats.tractCount} tracts are food deserts (${n(stats.lilaShare)}%)`, 'text-orange-500'],
				[n(stats.doubleBurdenCount, 0), 'food-desert tracts where 10%+ of households have no car', 'text-(--accent)'],
				[n(stats.householdsNoVeh, 0), `households without a vehicle (${n(stats.regionNoVehPct)}%)`, 'text-blue-500'],
				[n(stats.lowAccessPop, 0), 'people live more than ½ mile from a grocery store', 'text-emerald-500']
			] as [value, label, color] (label)}
				<div class="rounded-2xl bg-(--panel-2) p-4">
					<div class="text-3xl font-extrabold tabular-nums {color}">{value}</div>
					<div class="mt-1 text-sm text-(--muted)">{label}</div>
				</div>
			{/each}
		</div>

		<table class="w-full text-sm">
			<thead>
				<tr class="text-xs tracking-wider text-(--muted) uppercase">
					<th class="pb-2 text-left font-semibold"></th>
					<th class="pb-2 text-right font-semibold">Food deserts</th>
					<th class="pb-2 text-right font-semibold">Other tracts</th>
				</tr>
			</thead>
			<tbody class="tabular-nums">
				<tr class="border-t border-(--border)">
					<td class="py-2">Avg. households with no car</td>
					<td class="text-right font-bold">{n(stats.avgNoVehLila)}%</td>
					<td class="text-right text-(--muted)">{n(stats.avgNoVehOther)}%</td>
				</tr>
				<tr class="border-t border-(--border)">
					<td class="py-2">Avg. distance to a station</td>
					<td class="text-right font-bold">{n(stats.avgMilesLila, 2)} mi</td>
					<td class="text-right text-(--muted)">{n(stats.avgMilesOther, 2)} mi</td>
				</tr>
				<tr class="border-t border-(--border)">
					<td class="py-2">Avg. median household income</td>
					<td class="text-right font-bold">{usd(stats.avgIncomeLila)}</td>
					<td class="text-right text-(--muted)">{usd(stats.avgIncomeOther)}</td>
				</tr>
			</tbody>
		</table>

		{#if stats.farthest}
			<p class="mt-4 rounded-xl bg-(--accent-soft) p-3 text-sm">
				<b>Farthest from transit:</b> tract {stats.farthest.geoid}
				{stats.farthest.county ? `(${stats.farthest.county})` : ''}, {n(stats.farthest.miles, 2)} miles to the
				nearest station.
			</p>
		{/if}
	{/if}
</About>

<!-- About modal -->
<About bind:showModal dark={isDark}>
	{#snippet header()}
		<h2 class="mb-3 text-2xl font-extrabold tracking-tight">About this map</h2>
	{/snippet}

	<div class="space-y-4 text-sm leading-relaxed">
		<p>
			This map looks at where getting groceries is hardest in Dallas–Fort Worth: neighborhoods that are far
			from a grocery store <em>and</em> where many households don't own a car, and how close those
			neighborhoods are to rail transit.
		</p>
		<dl class="space-y-2">
			<div><dt class="font-bold">Food deserts</dt><dd class="text-(--muted)">USDA low-income, low-access tracts: at least 1 mile from a supermarket in urban areas, or 10 miles in rural areas.</dd></div>
			<div><dt class="font-bold">Low access ½ mile</dt><dd class="text-(--muted)">People living more than half a mile from a grocery store.</dd></div>
			<div><dt class="font-bold">No vehicle</dt><dd class="text-(--muted)">Share of households that report owning no car.</dd></div>
			<div><dt class="font-bold">Station distance</dt><dd class="text-(--muted)">Lines connecting each tract to its nearest rail station.</dd></div>
		</dl>

		<h3 class="pt-1 text-xs font-bold tracking-wider text-(--muted) uppercase">Sources</h3>
		<ul class="space-y-1.5 [&_a]:font-semibold [&_a]:text-(--accent) [&_a:hover]:underline">
			<li>U.S. Census Bureau, American Community Survey 5-year estimates: B08201 (vehicles available) and B19049 (median household income).</li>
			<li>USDA Economic Research Service, <a href="https://www.ers.usda.gov/data-products/food-access-research-atlas/" target="_blank" rel="noopener">Food Access Research Atlas</a>.</li>
			<li>USDA Food and Nutrition Service, <a href="https://www.fns.usda.gov/snap/retailer/data" target="_blank" rel="noopener">SNAP Retailer Locator data</a> (2025). Used instead of the general store dataset, which was last updated in 2019, before COVID.</li>
			<li>Rail lines and stations: DART, Trinity Metro and DCTA transit data.</li>
			<li>Basemap: <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors.</li>
			<li>Icons: <a href="https://www.flaticon.com/free-icons/moon" target="_blank" rel="noopener">Moon icons by Good Ware</a>, <a href="https://www.flaticon.com/free-icons/train-stop" target="_blank" rel="noopener">train stop icons by andinur</a> (Flaticon).</li>
		</ul>
	</div>
</About>
