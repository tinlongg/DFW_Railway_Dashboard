<script>
    import Map from '#lib/components/Map.svelte';
    import darkMode from '#lib/assets/dark_mode.png';
    import lightMode from '#lib/assets/light_mode.png';
	import About from '#lib/components/About.svelte';


    let isHovered = $state(false);
    let isDark = $state(false);
    let isDisabled = $state(false);

    let showModal = $state(false);
    let showStatModal = $state(false);

    let showTracts = $state(true);
    let showRails = $state(true);
    let showStations = $state(true);
    let showDistance = $state(false);

    let maxPctNoVeh = $state(0);

    function toggleMode(){
        isDark = !isDark;
        console.log('this is mode: ',{isDark});
    }
    let icon = $derived(
        isHovered
        ? (isDark ? lightMode : darkMode)
        : (isDark ? darkMode : lightMode)
    );
    function loadtime(){
        isDisabled = true;
        
        setTimeout(() => {
            isDisabled = false;
        }, 3500);
        toggleMode()
    }
    const btnCss = "bg-violet-50 rounded-3xl p-5 hover:bg-violet-400"
</script>

<main class="h-screen flex flex-col w-screen overflow-hidden bg-[#b7ccef] rounded-3xl">

<!-- this is the top/nav bar-->
<header class="flex h-16 w-full items-center justify-between px-6 text-white" dir="rtl">
    <button 
    disabled = {isDisabled}
    class="rounded p-1 transition hover:bg-white-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
    onclick={loadtime}
    >
        {#if isDisabled}
            <span class="text-xs font-semibold text-slate-700">loading...</span>
        {:else}
            <img 
        class="h-9 w-9" 
        src={icon} 
        alt="moon shaded in"/>
        {/if}
        <!-- <a href="https://www.flaticon.com/free-icons/moon" title="moon icons">Moon icons created by Good Ware - Flaticon</a> -->
    </button>

    <div class="flex items-right justify-end gap-2">
        <button class="text-black font-semibold text-2xl bg-violet-400 rounded-4xl p-3 hover:cursor-pointer" onclick={() => (showStatModal = true)}>Stand out Statistics</button>
        <About bind:showModal = {showStatModal}>
        	{#snippet header()}
                <h2>helrld</h2>
            {/snippet}

            <ol>
                <h1>hello world</h1>
            </ol>
        </About>
    </div>

    <div class="flex w-175 items-center">
        <h1 class="text-3xl text-black ">Food & Transportation Access Map</h1>
    </div>

</header>

<!-- this is the side & map-->
<div class="flex flex-1 overflow-hidden">
    <aside class="flex-col flex w-64 px-6">
        <nav class="space-y-2 text-md text-black">
        <!-- put the data and sliders here -->
        <h2 class="font-bold text-2xl">Layers</h2>
        <div class="grid grid-cols-2 gap-2 w-full">
            <button class="{btnCss}" onclick={() => showTracts = !showTracts}>Tracts</button>
            <button class="{btnCss}" onclick={() => showStations = !showStations}>Stations</button>
            <button class="{btnCss}" onclick={() => showRails = !showRails}>Railways</button>
            <button class="{btnCss}" onclick={() => showDistance = !showDistance}>Distance</button>
        </div>
        <h2 class="font-bold text-2xl text-black">Sliders</h2>
        <!-- Percentage of household without a vehicle  -->
        <div class="mt-2 space-y-2">
            <h3>Percentage of Households without a Vehicle</h3>
            <div class="flex justify-between items-center text-sm font-semibold">
                <span class="text-violet-800 bg-violet-300 px-2 py-0.5 rounded-lg">{maxPctNoVeh}%</span>

                <input 
                type="range"
                min="0"
                max="46.4"
                step="0.1"
                bind:value={maxPctNoVeh}
                class="w=full accent-violet-600 cursor-pointer"
                />
            </div>
        </div>
        </nav>
        <div class="absolute bottom-5 text-2xl bg-violet-500 hover:bg-violet-600 rounded-4xl p-3 ">
        <button class="hover:cursor-pointer" onclick= {() => (showModal = true)} > About / Sources </button>
        <About bind:showModal>
        	{#snippet header()}
                <h2>hello world</h2>
            {/snippet}

            <ol>
                <h1>hello world</h1>
            </ol>
        </About>
        </div>
    </aside>
    <div class="relative flex-1 border-[#b7ccef] border-10 rounded-3xl">
    <Map 
        {isDark}
        {showTracts} 
        {showRails} 
        {showStations} 
        {showDistance}
        {maxPctNoVeh}
    />
    </div>
</div>

</main>
