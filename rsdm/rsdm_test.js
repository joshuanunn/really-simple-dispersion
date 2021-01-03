const tolerance = 0.00000001;

function testApproxEqual(val, ref) {
	let diff = Math.abs(ref - val);
	
	if (diff < tolerance) {
		console.log("[PASS]");
	} else {
		console.log(`[FAIL] got ${val}, wanted ${ref}`);
	}
}

function testStringEqual(val, ref) {
	if (val === ref) {
		console.log("[PASS]");
	} else {
		console.log(`[FAIL] got ${val}, wanted ${ref}`);
	}
}

function testIsNan(val) {
	if (isNaN(val)) {
		console.log("[PASS]");
	} else {
		console.log(`[FAIL] got ${val}, wanted NaN`);
	}
}

function testPlumeRise() {
	// Example from:
	// https://ceprofs.civil.tamu.edu/qying/cven301_fall2014_arch/lecture7_c.pdf
	const vs = 20.0;  // m/s
	const ds = 5.0;   // m
	const U = 6.0;    // m/s
	const Ts = 400.0; // K
	const Ta = 280.0; // K
	const pgcat = 'D';

	const dHRef = 223.352113600373;
	const XfRef = 1264.034881130080;

	const [dH, Xf] = plumeRise(U, vs, ds, Ts, Ta, pgcat);
	
	testApproxEqual(dH, dHRef);
	testApproxEqual(Xf, XfRef);
}

function testRSDMDefaults() {
	const dm = new RSDM();

	const gridRef = 10;
	testApproxEqual(dm.grid, gridRef);

	const wspdRef = 5.0;
	testApproxEqual(dm.wspd, wspdRef);

	const wdirRef = 235;
	testApproxEqual(dm.wdir, wdirRef);

	const elevationRef = 50.0;
	testApproxEqual(dm.source.elevation, elevationRef);

	const diameterRef = 0.5;
	testApproxEqual(dm.source.diameter, diameterRef);

	const velocityRef = 10.0;
	testApproxEqual(dm.source.velocity, velocityRef);

	const tempRef = 60.0;
	testApproxEqual(dm.source.temp, tempRef);

	const emissionRef = 1.0;
	testApproxEqual(dm.source.emission, emissionRef);

	const pgcatRef = 'C';
	testStringEqual(dm.pgcat, pgcatRef);

	const roughnessRef = "urban";
	testStringEqual(dm.roughness, roughnessRef);
}

function testGridSetup() {
	const extentA = new Grid(-2500, 2500, -2500, 2500, 25, 25);
	const gridA = extentA.generateGrid();
	const countXA = gridA[0].length;
	const countYA = gridA.length;

	const countXARef = 201;
	testApproxEqual(countXA, countXARef);

	const countYARef = 201;
	testApproxEqual(countYA, countYARef);

	const extentB = new Grid(-27, 300, 50, 5580, 3, 10);
	const gridB = extentB.generateGrid();
	const countXB = gridB[0].length;
	const countYB = gridB.length;

	const countXBRef = 110;
	testApproxEqual(countXB, countXBRef);

	const countYBRef = 554;
	testApproxEqual(countYB, countYBRef);
}

function testConvertCoords() {
	const s = new Source(-2.0, -3.0, 50.0, 0.5, 10.0, 60.0, 1.0);
	
	const sinPHI = Math.sin(200.0 * Math.PI / 180);
	const cosPHI = Math.cos(200.0 * Math.PI / 180);
	let [x, y] = s.windComponents(10.0, 10.0, sinPHI, cosPHI);

	const xRef = 0.016320245790;
	testApproxEqual(x, xRef);

	const yRef = -6.8300495861972;
	testApproxEqual(y, yRef);
}

function testModelRun() {
	// Create new *RSDM and populate with fixed values (overwrite defaults)
	const dm = new RSDM();
	dm.grid = 20;
	dm.wspd = 2.0;
	dm.wdir = 130;
	dm.source.elevation = 10.0;
	dm.source.temp = 100.0;
	dm.pgcat = 'A';
	dm.hours = 1;

	// Manually run dm.setupGrids such that if default extents change (unrelated), test does not fail
	dm.rCoords = new Grid(-2500, 2500, -2500, 2500, dm.grid, dm.grid);
	dm.rGrid = dm.rCoords.generateGrid();
	dm.rDisp = dm.rCoords.generateGrid();
	dm.hCoords = new Grid(-2500, 2500, 0, 1000, dm.grid, dm.grid/2);
	dm.hGrid = dm.hCoords.generateGrid();
	dm.hDisp = dm.hCoords.generateGrid();

	dm.runModel(1);

	const rGridRef = 6.366502967443e-08;
	const hGridRef = 4.086979994894e-07;

	const rGrid = dm.rGrid[23][14];
	testApproxEqual(rGrid, rGridRef);

	const hGrid = dm.hGrid[19][181];
	testApproxEqual(hGrid, hGridRef);
}

function testSigmaY() {
	// stability class D, 0.5km downwind, example from:
	// http://faculty.washington.edu/markbenj/CEE357/CEE%20357%20air%20dispersion%20models.pdf
	testApproxEqual(SigmaY['D'](0.5), 36.146193496038);

	// stability class A, 0.997km downwind
	testApproxEqual(SigmaY['A'](0.997), 208.157523627706);

	// stability class B, 12.345m downwind
	testApproxEqual(SigmaY['B'](0.012345), 2.835970876943);

	// stability class C, 27.85km downwind
	testApproxEqual(SigmaY['C'](27.85), 2025.696103458910);

	// stability class D, 5.78m upwind (should be NaN)
	testIsNan(SigmaY['D'](-0.00578));
	
	// stability class E, 445m downwind
	testApproxEqual(SigmaY['E'](0.445), 24.275915684479);

	// stability class F, 7.5558km downwind
	testApproxEqual(SigmaY['F'](7.5558), 210.931775211803);
}

function testSigmaZ() {
	// stability class D, 0.5km downwind, example from:
	// http://faculty.washington.edu/markbenj/CEE357/CEE%20357%20air%20dispersion%20models.pdf
	testApproxEqual(SigmaZ['D'](0.5), 18.296892641654);

	// stability class D, 5.78m upwind (should be NaN)
	testIsNan(SigmaZ['D'](-0.00578));

	// stability class A, 50m downwind
	testApproxEqual(SigmaZ['A'](0.05), 7.246283645973);

	// stability class A, 270m downwind
	testApproxEqual(SigmaZ['A'](0.27), 41.523682287423);

	// stability class A, 2.86km downwind
	testApproxEqual(SigmaZ['A'](2.86), 4196.204889704382);

	// stability class A, 54km downwind
	testApproxEqual(SigmaZ['A'](54.0), 5000.0);

	// stability class B, 50m downwind
	testApproxEqual(SigmaZ['B'](0.05), 5.558326444834);

	// stability class B, 270m downwind
	testApproxEqual(SigmaZ['B'](0.27), 27.177523893054);

	// stability class B, 2.86km downwind
	testApproxEqual(SigmaZ['B'](2.86), 346.177898273921);

	// stability class B, 54km downwind
	testApproxEqual(SigmaZ['B'](54.0), 5000.0);

	// stability class C, 50m downwind
	testApproxEqual(SigmaZ['C'](0.05), 3.947711911749);

	// stability class C, 270m downwind
	testApproxEqual(SigmaZ['C'](0.27), 18.459902569036);

	// stability class C, 2.86km downwind
	testApproxEqual(SigmaZ['C'](2.86), 159.862915743170);

	// stability class C, 54km downwind
	testApproxEqual(SigmaZ['C'](54.0), 2348.910612301645);

	// stability class D, 50m downwind
	testApproxEqual(SigmaZ['D'](0.05), 2.545334368597);

	// stability class D, 270m downwind
	testApproxEqual(SigmaZ['D'](0.27), 11.034101898944);

	// stability class D, 2.86km downwind
	testApproxEqual(SigmaZ['D'](2.86), 63.142784897226);

	// stability class D, 54km downwind
	testApproxEqual(SigmaZ['D'](54.0), 339.310493995667);

	// stability class E, 50m downwind
	testApproxEqual(SigmaZ['E'](0.05), 1.979015073784);

	// stability class E, 270m downwind
	testApproxEqual(SigmaZ['E'](0.27), 7.978143439122);

	// stability class E, 2.86km downwind
	testApproxEqual(SigmaZ['E'](2.86), 41.083717338729);

	// stability class E, 54km downwind
	testApproxEqual(SigmaZ['E'](54.0), 155.031915174584);

	// stability class F, 50m downwind
	testApproxEqual(SigmaZ['F'](0.05), 1.321315762922);

	// stability class F, 270m downwind
	testApproxEqual(SigmaZ['F'](0.27), 5.178781257565);

	// stability class F, 2.86km downwind
	testApproxEqual(SigmaZ['F'](2.86), 26.282658227590);

	// stability class F, 54km downwind
	testApproxEqual(SigmaZ['F'](54.0), 80.882017663045);
}

function testCalcUz() {
	let uzref = 3.5;
	let z = 100.0;
	let zref = 10.0;
	let pgcat = 'D';
	let roughness = "rural";

	let uAdj = CalcUz(uzref, z, zref, pgcat, roughness);

	testApproxEqual(uAdj, 4.943881406180);

	uzref = 10.0;
	z = 50.0;
	zref = 45.0;
	pgcat = 'A';
	roughness = "urban";

	uAdj = CalcUz(uzref, z, zref, pgcat, roughness);

	testApproxEqual(uAdj, 10.159296222811);
}

function testC() {
	// Example from:
	// http://faculty.washington.edu/markbenj/CEE357/CEE%20357%20air%20dispersion%20models.pdf

	const x = 0.5; // 500 m downwind
	const y = 0.0; // along plume centreline
	const z = 0.0; // ground level

	const u = 6.0;     // 6 m/s wind speed at height of 50 m
	const pgcat = 'D'; // Neutral stability

	// Source centred on (0,0), height 50 m, 10 g/s mass emission rate
	const source = new Source(0.0, 0.0, 50.0, 0.5, 10.0, 60.0, 10.0);
	const Q = source.emission;
	const H = source.elevation;

	// Calculate concentration at (x,y,z) == 19.2 ug/m3
	const sigY = SigmaY[pgcat];
	const sigZ = SigmaZ[pgcat];
	const conc = C(x, y, z, u, Q, H, sigY, sigZ);
	testApproxEqual(conc, 1.917230120488e-05);
}

// Run tests
testPlumeRise();
testSigmaY();
testSigmaZ();
testCalcUz();
testC();
testRSDMDefaults();
testGridSetup();
testConvertCoords();
testModelRun();
