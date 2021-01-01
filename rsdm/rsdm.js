//////////////////////////////////////////////////////////////////////////////
/// RSDM
//////////////////////////////////////////////////////////////////////////////

// Mapping of image quality selection to grid step (m)
const gridQuality = {
	"Low":    50,
	"Medium": 25,
	"High":   10,
};

// Grid is a class defining the output grid dimensions
class Grid {
	constructor(xmin, xmax, ymin, ymax, xgap, ygap) {
		this.xmin = xmin; // x extents (m)
		this.xmax = xmax;
		this.ymin = ymin; // y extents (m)
		this.ymax = ymax;
		this.xgap = xgap; // x step (m)
		this.ygap = ygap; // y step (m)
	}

	generateGrid() {
		const cols = (this.xmax - this.xmin) / this.xgap + 1;
		const rows = (this.ymax - this.ymin) / this.ygap + 1;
		
		let grid = Array(rows).fill().map(() => Array(cols).fill(0));
		return grid;
	}
}

// Source is a class defining the stack parameters (emission source)
class Source {
	constructor(x, y, elevation, diameter, velocity, temp, emission) {
		this.x = x;                 // Stack x location (m)
		this.y = y;                 // Stack y location (m)
		this.elevation = elevation; // Stack height (m)
		this.diameter = diameter;   // Stack diameter (m)
		this.velocity = velocity;   // Plume velocity at stack tip (m/s)
		this.temp = temp;           // Plume temperature (C)
		this.emission = emission;   // Stack emission rate (g/s)
	}
	
	/*
	Calculate the downwind (x) and crosswind (y) plume components from rectangular coordinates.
	inputs:
	Xr		[m]		easting relative to origin at stack
	Yr		[m]		northing relative to origin at stack
	sinPHI	[]	    sine of wind direction
	cosPHI	[]	    cosine of wind direction

	returns:
	x		[km]	downwind plume receptor distance
	y		[m]		crosswind plume receptor distance
	*/
	windComponents(Xr, Yr, sinPHI, cosPHI) {
		const x = (-1*(Xr-this.x)*sinPHI - (Yr-this.y)*cosPHI) / 1000;
		const y = (Xr-this.x)*cosPHI - (Yr-this.y)*sinPHI;
		return [x, y];
	}
}

// RSDM is a class for maintaining the state of all key data variables
class RSDM {
	constructor() {
		let source = new Source(0.0, 0.0, 50.0, 0.5, 10.0, 60.0, 1.0);
		
		this.grid = gridQuality["High"];
		this.wspd = 5.0;
		this.wdir = 235;
		this.roughness = "urban";
		this.pgcat = 'C';
		this.source = source;

		this.setupGrids();
	}

	setupGrids() {
		// Initialises internal grids used for display buffers.
		// Should be called to reset simulation.

		// Setup x,y grid for plan view
		this.rCoords = new Grid(-2500, 2500, -2500, 2500, this.grid, this.grid);
		this.rGrid = this.rCoords.generateGrid();
		this.rDisp = this.rCoords.generateGrid();
		
		// Setup x,z plane height plume cross-section view
		this.hCoords = new Grid(-2500, 2500, 0, 1000, this.grid, this.grid/2);
		this.hGrid = this.hCoords.generateGrid();
		this.hDisp = this.hCoords.generateGrid();
	}

	clearGrid(grid) {
		const rows = grid.length;
		const cols = grid[0].length;
		
		for (let y=0; y<rows; y++) {
			for (let x=0; x<cols; x++) {
				grid[y][x] = 0;
			}
		}
	}

	updateImage() {
		// Extract maximum value from grids
		let gridsMax = Math.max(gridMax(this.rGrid), gridMax(this.hGrid));
		
		// Create PNG for plan and plume views
		let rImg = generatePNG(this.rGrid, this.rDisp, gridsMax);
		let hImg = generatePNG(this.hGrid, this.hDisp, gridsMax);
		
		// Output to browser
		exportPNG(rImg, "rImg");
		exportPNG(hImg, "hImg");
	}

	log(message) {
		document.getElementById("status").innerText = message;
	}

	runModel(hours) {
		this.clearGrid(this.rGrid);
		this.clearGrid(this.hGrid);

		// Generate random meteorological data for specified number of hours
		let met = GenMET(this, hours);

		// Run disperion model and update internal arrays
		iterDisp(this, met);
	}

	sourceAdj(parameter, value) {
		this.source[parameter] = Number(value);
		this.runModel(1);
		this.updateImage();
	}

	modelAdj(parameter, value) {
		this[parameter] = Number(value);
		this.runModel(1);
		this.updateImage();
	}

	modelAdjDesc(parameter, value) {
		this[parameter] = value;
		this.runModel(1);
		this.updateImage();
	}

	gridAdjDesc(parameter, value) {
		this.grid = gridQuality[value];
		this.setupGrids();
		this.runModel(1);
		this.updateImage();
	}

	simulate(hours) {
		this.runModel(hours);
		this.updateImage();
		this.log("Ready.");
	}	
}
