//////////////////////////////////////////////////////////////////////////////
/// Disperse
//////////////////////////////////////////////////////////////////////////////

const g = 9.80616;           // Gravitational constant
const ambientTemp = 293.15;  // Fixed ambient temperature [K] (20 C)

function sigmaY(c, d) {
	return x => {
		const theta = 0.017453293 * (c - d*Math.log(x));
		return 465.11628 * x * Math.tan(theta);
	};
}

const SigmaY = {
	"A": sigmaY(24.1670, 2.5334),
	"B": sigmaY(18.3330, 1.8096),
	"C": sigmaY(12.5000, 1.0857),
	"D": sigmaY(8.3330, 0.72382),
	"E": sigmaY(6.2500, 0.54287),
	"F": sigmaY(4.1667, 0.36191),
};

function sigmaZ(a, b, x) {
	return a * Math.pow(x, b);
}

const SigmaZ = {
	"A": sigmaZA,
	"B": sigmaZB,
	"C": sigmaZC,
	"D": sigmaZD,
	"E": sigmaZE,
	"F": sigmaZF,
};

function sigmaZA(x) {
	let Sz = 0;
	if (x <= 0.10) {Sz = sigmaZ(122.800, 0.94470, x);} else
	if (x <= 0.15) {Sz = sigmaZ(158.080, 1.05420, x);} else
	if (x <= 0.20) {Sz = sigmaZ(170.220, 1.09320, x);} else
	if (x <= 0.25) {Sz = sigmaZ(179.520, 1.12620, x);} else
	if (x <= 0.30) {Sz = sigmaZ(217.410, 1.26440, x);} else
	if (x <= 0.40) {Sz = sigmaZ(258.890, 1.40940, x);} else
	if (x <= 0.50) {Sz = sigmaZ(346.750, 1.72830, x);} else
	if (x <= 3.11) {Sz = sigmaZ(453.850, 2.11660, x);} else
	{Sz = 5000;}
	
	if (Sz > 5000.0) {
		Sz = 5000.0;
	}
	return Sz;
}

function sigmaZB(x) {
	let Sz = 0;
	if (x <= 0.20) {Sz = sigmaZ(90.673, 0.93198, x);} else
	if (x <= 0.40) {Sz = sigmaZ(98.483, 0.98332, x);} else
	{Sz = sigmaZ(109.300, 1.09710, x);}

	if (Sz > 5000.0) {
		Sz = 5000.0;
	}
	return Sz;
}

function sigmaZC(x) {
	let Sz = sigmaZ(61.141, 0.91465, x);
	
	if (Sz > 5000.0) {
		Sz = 5000.0;
	}
	return Sz;
}

function sigmaZD(x) {
	let Sz = 0;
	if (x <= 0.30) {Sz = sigmaZ(34.459, 0.86974, x);} else
	if (x <= 1.00) {Sz = sigmaZ(32.093, 0.81066, x);} else
	if (x <= 3.00) {Sz = sigmaZ(32.093, 0.64403, x);} else
	if (x <= 10.00)	{Sz = sigmaZ(33.504, 0.60486, x);} else
	if (x <= 30.00) {Sz = sigmaZ(36.650, 0.56589, x);} else
	{Sz = sigmaZ(44.053, 0.51179, x);}

	return Sz;
}

function sigmaZE(x) {
	let Sz = 0;
	if (x <= 0.10) {Sz = sigmaZ(24.260, 0.83660, x);} else
	if (x <= 0.30) {Sz = sigmaZ(23.331, 0.81956, x);} else
	if (x <= 1.00) {Sz = sigmaZ(21.628, 0.75660, x);} else
	if (x <= 2.00) {Sz = sigmaZ(21.628, 0.63077, x);} else
	if (x <= 4.00) {Sz = sigmaZ(22.534, 0.57154, x);} else
	if (x <= 10.00)	{Sz = sigmaZ(24.703, 0.50527, x);} else
	if (x <= 20.00) {Sz = sigmaZ(26.970, 0.46713, x);} else
	if (x <= 40.00)	{Sz = sigmaZ(35.420, 0.37615, x);} else
	{Sz = sigmaZ(47.618, 0.29592, x);}
	
	return Sz;
}

function sigmaZF(x) {
	let Sz = 0;
	if (x <= 0.20) {Sz = sigmaZ(15.209, 0.81558, x);} else
	if (x <= 0.70) {Sz = sigmaZ(14.457, 0.78407, x);} else
	if (x <= 1.00) {Sz = sigmaZ(13.953, 0.68465, x);} else
	if (x <= 2.00) {Sz = sigmaZ(13.953, 0.63227, x);} else
	if (x <= 3.00) {Sz = sigmaZ(14.823, 0.54503, x);} else
	if (x <= 7.00) {Sz = sigmaZ(16.187, 0.46490, x);} else
	if (x <= 15.00) {Sz = sigmaZ(17.836, 0.41507, x);} else
	if (x <= 30.00) {Sz = sigmaZ(22.651, 0.32681, x);} else
	if (x <= 60.00) {Sz = sigmaZ(27.074, 0.27436, x);} else
	{Sz = sigmaZ(34.219, 0.21716, x);}

	return Sz;
}

const windProfile = {
	"urban": {
		"A": 0.15,
		"B": 0.15,
		"C": 0.20,
		"D": 0.25,
		"E": 0.30,
		"F": 0.30,
	},
	"rural": {
		"A": 0.07,
		"B": 0.07,
		"C": 0.10,
		"D": 0.15,
		"E": 0.35,
		"F": 0.55,
	},
};

/*
Calculate effective wind speed, using "power law" method

inputs:
uzref		[m/s]	wind speed of actual measurment
z			[m]		target elevation
zref		[m]		elevation of actual measurement
pgcat		[]		Pasquill-Gifford stability category
profileType	[]		"urban" or "rural"

returns:
Uz			[m/s] 	estimated wind speed at target elevation z
*/
function CalcUz(uzref, z, zref, pgcat, profileType) {
	// p is the wind profile exponent factor
	const p = windProfile[profileType][pgcat];
	const Uz = uzref * Math.pow(z/zref, p);
	return Uz;
}

/*
Calculate concentration at distance x along plume, at perpendicular offset y and height z

inputs:
x		[km]	receptor distance downwind along plume centreline
y		[m]		receptor perpendicular offset from plume centreline
z		[m]		receptor height
Uz		[m/s]	wind speed at stack exit
Q		[g/s]	pollutant mass emission rate
H		[m]		effective stack height (includes plume rise)
sigY	[f(m)]	y plume sigma formula (function of distance in m)
sigZ	[f(m)]	z plume sigma formula (function of distance in m)

returns:
conc	[g/m3]	calculated receptor concentration
*/
function C(x, y, z, Uz, Q, H, sigY, sigZ) {
	// Early return if coordinate upwind, as concentration always zero
	if (x <= 0) {
		return 0;
	}

	let Sz = sigZ(x);
	let Sy = sigY(x);

	let Sz2 = 2 * Sz * Sz;
	let Sy2 = 2 * Sy * Sy;

	let c1 = Q / (2 * Math.PI * Uz * Sy * Sz);
	let c2 = Math.exp(-1 * (z - H) * (z - H) / Sz2);
	let c3 = Math.exp(-1 * (z + H) * (z + H) / Sz2);
	let c4 = Math.exp(-1 * y * y / Sy2);

	let conc = c1 * (c2 + c3) * c4; // g/m3
	if (!isFinite(conc)) {
		conc = 0;
	}
	return conc;
}

/*
Calculates the plume rise (dH) and a downwind plume offset (Xf), using Briggs model.

inputs:
us		[m/s]	wind velocity at stack tip
vs		[m/s]	stack exit velocity
ds		[m]		stack tip diameter
Ts		[K]		stack tip temperature
Ta		[K]		ambient temperature
pgcat	[]		Pasquill-Gifford stability category

returns:
dH		[m]		plume rise
Xf		[m]		plume rise offset
*/
function plumeRise(us, vs, ds, Ts, Ta, pgcat) {
	// Compute buoyancy flux
	const Fb = g * vs * ds * ds * (Ts - Ta) / (4 * Ts);
	// Calculate momentum flux
	const Fm = vs * vs * ds * ds * Ta / (4 * Ts);

	let Xf = 0;
	let dH = 0;

	// Stable PG categories
	if (pgcat === "E" || pgcat === "F") {
		let eta = 0;
		if (pgcat === "E") {
			eta = 0.020;
		} else {
			eta = 0.035;
		}
		const s = g * eta / Ta;
		const dT = 0.019582 * Ts * vs * Math.sqrt(s);
		// Buoyancy dominated
		if ((Ts - Ta) >= dT) {
			Xf = 2.0715 * us / Math.sqrt(s);
			dH = 2.6 * Math.pow(Fb/(us*s), 0.333333333333);
			// Momentum dominated
		} else {
			Xf = 0;
			// Calculate unstable/neutral and stable plume rise and take min
			const prUN = 3.0 * ds * vs / us;
			const prS = 1.5 * Math.pow(Fm/(us*Math.sqrt(s)), 0.333333333333);
			dH = Math.min(prUN, prS);
		}
		// Unstable or neutral PG categories
	} else {
		// Unstable or neutral
		if (Fb < 55.0) {
			// Check for buoyancy dominated or momentum
			const dT = 0.0297 * Ts * Math.pow(vs, 0.333333333333) / Math.pow(ds, 0.666666666667);
			// Buoyancy dominated
			if ((Ts - Ta) >= dT) {
				Xf = 49.0 * Math.pow(Fb, 0.625);
				dH = 21.425 * Math.pow(Fb, 0.75) / us;
				// Momentum dominated
			} else {
				Xf = 0;
				dH = 3.0 * ds * vs / us;
			}
		} else {
			const dT = 0.00575 * Ts * Math.pow(vs, 0.666666666667) / Math.pow(ds, 0.333333333333);
			if ((Ts - Ta) >= dT) {
				Xf = 119.0 * Math.pow(Fb, 0.4);
				dH = 38.71 * Math.pow(Fb, 0.6) / us;
			} else {
				Xf = 0;
				dH = 3.0 * ds * vs / us;
			}
		}
	}
	return [dH, Xf];
}

/*
Iterate though each met hour and calculate concentrations across plan and slice grids.

Uses a single source located at the origin, at a user specified height.
*/
function iterDisp(rsdm, met) {
	// PNG array offsets
	const yc = rsdm.rGrid.length - 1;
	const zc = rsdm.hCoords.ymax / rsdm.hCoords.ygap;
	
	for (const metline of met) {
		// Calculate effective wind speed at stack tip (user specified wind speed is for 10 m)
		let Uz = CalcUz(metline.U, rsdm.source.elevation, 10, metline.PGCat, rsdm.roughness);
		
		// Calculate plume rise using Briggs equations
		let Ts = rsdm.source.temp + 273.15;
		let [dH, Xf] = plumeRise(Uz, rsdm.source.velocity, rsdm.source.diameter, Ts, ambientTemp, metline.PGCat);
		let H = rsdm.source.elevation + dH;
		let Q = rsdm.source.emission;
		
		let sinPHI = Math.sin(metline.PHI);
		let cosPHI = Math.cos(metline.PHI);
		let sigY = SigmaY[metline.PGCat];
		let sigZ = SigmaZ[metline.PGCat];
		
		// Calculate concentrations for plan view grid (fixed grid height of 0 m)
		let x = 0;
		let total = 0;
		for (let Xr=rsdm.rCoords.xmin; Xr<=rsdm.rCoords.xmax; Xr+=rsdm.rCoords.xgap) {
			let y = 0;
			for (let Yr=rsdm.rCoords.ymin; Yr<=rsdm.rCoords.ymax; Yr+=rsdm.rCoords.ygap) {
				if (Uz > 0.5) {
					let [xx, yy] = rsdm.source.windComponents(Xr, Yr, sinPHI, cosPHI);
					xx -= (Xf / 1000); // Plume rise correction
					rsdm.rGrid[yc-y][x] += C(xx, yy, 0, Uz, Q, H, sigY, sigZ) / metline.Hours;
				}
				y++;
			}
			x++;
		}

		// Calculate concentrations for 2d slice showing height profile along plume
		let z = 0;
		let offset = (rsdm.hCoords.xmax - rsdm.hCoords.xmin) / 2 / rsdm.hCoords.xgap;
		for (let Zh=0; Zh<=rsdm.hCoords.ymax; Zh+=rsdm.hCoords.ygap) {
			x = 0;
			if (Uz > 0.5) {
				for (let Xh=0; Xh<=rsdm.hCoords.xmax; Xh+=rsdm.hCoords.xgap) {
					let xx = (Xh - Xf) / 1000; // Includes plume rise correction
					rsdm.hGrid[zc-z][offset+x] += C(xx, 0.0, Zh, Uz, Q, H, sigY, sigZ) / metline.Hours;
					x++;
				}
			}
			z++;
		}
	}
}
