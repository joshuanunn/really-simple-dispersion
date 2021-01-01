//////////////////////////////////////////////////////////////////////////////
/// Pre-process
//////////////////////////////////////////////////////////////////////////////

class HourMET {
	constructor(hours, u, phi, pgcat) {
		this.Hours = hours;
		this.U = u;
		this.PHI = phi;
		this.PGCat = pgcat;
	}
}

function Round(x, places) {
	return Math.round(x*places) / places;
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function GenMET(rsdm, hours) {
	// Create initial met hour based on browser values
	let wdirRad = rsdm.wdir * Math.PI / 180;
	
	let met = [];
	if (hours <= 1) {
		// If generating a single hour, use user values
		met.push(new HourMET(1, rsdm.wspd, wdirRad, rsdm.pgcat));
	} else {
		// Generate random hours
		for (let h=0; h<hours; h++) {
			// Generate random wind direction 0 - 350 degrees and convert to radians
			let wdir = getRandomInt(360);
			wdirRad = wdir * Math.PI / 180;

			// Generate a random windspeed (1-50 m/s) and PG class (A-F)
			const wspd = getRandomInt(50) + 1;
			const pgcat = "ABCDEF"[getRandomInt(6)];

			// Construct met hour
			met.push(new HourMET(hours, wspd, wdirRad, pgcat));
		}
	}
	return met;
}
