# DFW Food & Transportation Access Map

An interactive map of Dallas–Fort Worth census tracts. It shows where low food access
overlaps with low car ownership, and how far those neighborhoods are from rail transit.

Built with SvelteKit 2 / Svelte 5, Tailwind CSS 4 and MapLibre GL.

## Features
- **Layers:** census tracts, USDA food deserts (low-income / low-access), rail lines, stations, and tract-to-nearest-station distance lines
- **Slider:** highlights tracts where at least a chosen share of households has no vehicle
- **Tract popup:** households, % no vehicle, median income, people more than ½ mile from a grocery store,
  distance to the nearest station
- **Stand out Statistics:** region-wide numbers comparing food-desert tracts with all other tracts
- Light and dark basemaps

## Run it
```sh
npm install
npm run dev
```

## Data
| Field | Meaning | Source |
| --- | --- | --- |
| `B08201_*` | Households / households with no vehicle | ACS 5-year, table B08201 |
| `B19049_001E` | Median household income | ACS 5-year, table B19049 |
| `DD_SRAM_LILATracts_1And10` | Low income & low access (1 mi urban / 10 mi rural) | USDA Food Access Research Atlas |
| `DD_SRAM_lapophalf` | Population more than ½ mile from a supermarket | USDA Food Access Research Atlas |
| `Total_Miles` | Distance to the nearest rail station | Derived (network distance) |

Store locations use the 2025 USDA SNAP retailer data instead of the 2019 general store data.

Basemap © OpenFreeMap / OpenStreetMap contributors. Icons from Flaticon (Good Ware, andinur).
