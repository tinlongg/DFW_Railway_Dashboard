<script>
    import Map from '#lib/components/Map.svelte';
    import darkMode from '#lib/assets/dark_mode.png';
    import lightMode from '#lib/assets/light_mode.png';
	import About from '#lib/components/About.svelte';


    let isHovered = $state(false);
    let isDark = $state(false);
    let isDisabled = $state(false);
    let showModal = $state(false);

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
        }, 4500);
        toggleMode()
    }

</script>

<main class="h-screen flex flex-col w-screen overflow-hidden bg-[#b7ccef] rounded-3xl">

<!-- this is the top-->
<header class="flex h-16 w-full items-center justify-between px-6 text-white" dir="rtl">
    <button 
    disabled = {isDisabled}
    class="rounded p-1 transition hover:bg-white-10"
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

    <div class="flex w-175 items-center">
        <h1 class="text-3xl text-black ">Food & Transportation Access Map</h1>
    </div>

</header>

<!-- this is the side & map-->
<div class="flex flex-1 overflow-hidden">
    <aside class="flex-col flex w-64 px-6">
        <h1 class="text-xl font-bold text-black">wohj</h1>
        <nav class="space-y-2 text-md text-black">
        <!-- put the data and sliders here -->

        </nav>
        <div class="absolute bottom-5 text-2xl bg-violet-500 hover:bg-violet-600 rounded-4xl p-3 ">
        <button onclick={() => (showModal = true)}> About </button>
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
    <Map {isDark}/>
    </div>
</div>

</main>
