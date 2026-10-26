// Pulls tract attributes (no geometry) once and computes the headline numbers
// shown in the "Stand out Statistics" modal.

export const TRACTS_URL =
	'https://services1.arcgis.com/qr14biwnHA6Vis6l/arcgis/rest/services/DFW_Census_Tracts_Final_Master/FeatureServer/0/query';

export const TRACT_FIELDS =
	'GEOID,ALAND,State,County,B08201_001E,B08201_002E,B08201_calc_pctNoVehE,B19049_001E,DD_SRAM_LILATracts_1And10,DD_SRAM_lapophalf,From0_ORIG_FID,Total_Miles';

/** Treat "1", 1, true, "Yes" as a low-income / low-access tract. */
export function isLila(v) {
	if (v === null || v === undefined) return false;
	const s = String(v).trim().toLowerCase();
	return s === '1' || s === 'true' || s === 'yes';
}

const num = (v) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
};
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

/** ArcGIS caps records per request, so page through until done. */
async function fetchAllAttributes() {
	const rows = [];
	let offset = 0;
	const pageSize = 2000;
	while (true) {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: TRACT_FIELDS,
			returnGeometry: 'false',
			resultOffset: String(offset),
			resultRecordCount: String(pageSize),
			f: 'json'
		});
		const res = await fetch(`${TRACTS_URL}?${params}`);
		if (!res.ok) throw new Error(`Tract request failed (${res.status})`);
		const json = await res.json();
		if (json.error) throw new Error(json.error.message || 'ArcGIS error');
		const batch = (json.features || []).map((f) => f.attributes);
		rows.push(...batch);
		if (!json.exceededTransferLimit || batch.length === 0) break;
		offset += batch.length;
	}
	return rows;
}

export async function loadTractStats() {
	const rows = await fetchAllAttributes();

	const lila = rows.filter((r) => isLila(r.DD_SRAM_LILATracts_1And10));
	const noVeh = rows.map((r) => num(r.B08201_calc_pctNoVehE)).filter((n) => n !== null);
	const lilaNoVeh = lila.map((r) => num(r.B08201_calc_pctNoVehE)).filter((n) => n !== null);
	const otherNoVeh = rows
		.filter((r) => !isLila(r.DD_SRAM_LILATracts_1And10))
		.map((r) => num(r.B08201_calc_pctNoVehE))
		.filter((n) => n !== null);

	const miles = (list) => list.map((r) => num(r.Total_Miles)).filter((n) => n !== null);
	const income = (list) => list.map((r) => num(r.B19049_001E)).filter((n) => n !== null && n > 0);

	const households = rows.reduce((s, r) => s + (num(r.B08201_001E) || 0), 0);
	const householdsNoVeh = rows.reduce((s, r) => s + (num(r.B08201_002E) || 0), 0);
	const lowAccessPop = rows.reduce((s, r) => s + (num(r.DD_SRAM_lapophalf) || 0), 0);

	// "Double burden": food desert AND at least 10% of households have no car
	const doubleBurden = lila.filter((r) => (num(r.B08201_calc_pctNoVehE) || 0) >= 10);
	const farthest = [...rows]
		.filter((r) => num(r.Total_Miles) !== null)
		.sort((a, b) => num(b.Total_Miles) - num(a.Total_Miles))[0];

	return {
		tractCount: rows.length,
		lilaCount: lila.length,
		lilaShare: rows.length ? (lila.length / rows.length) * 100 : 0,
		households,
		householdsNoVeh,
		regionNoVehPct: households ? (householdsNoVeh / households) * 100 : null,
		maxNoVehPct: noVeh.length ? Math.max(...noVeh) : null,
		avgNoVehLila: avg(lilaNoVeh),
		avgNoVehOther: avg(otherNoVeh),
		avgMilesLila: avg(miles(lila)),
		avgMilesOther: avg(miles(rows.filter((r) => !isLila(r.DD_SRAM_LILATracts_1And10)))),
		avgIncomeLila: avg(income(lila)),
		avgIncomeOther: avg(income(rows.filter((r) => !isLila(r.DD_SRAM_LILATracts_1And10)))),
		lowAccessPop,
		doubleBurdenCount: doubleBurden.length,
		farthest: farthest
			? { geoid: farthest.GEOID, county: farthest.County, miles: num(farthest.Total_Miles) }
			: null
	};
}
