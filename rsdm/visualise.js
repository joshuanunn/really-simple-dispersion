//////////////////////////////////////////////////////////////////////////////
/// Visualise
//////////////////////////////////////////////////////////////////////////////

const bands = 10

// Extract max value from 2d grid
function gridMax(grid) {
	const rows = grid.length;
	const cols = grid[0].length;
	let max = -1.0;
	
	for (let y=0; y<rows; y++) {
		for (let x=0; x<cols; x++) {
			if (grid[y][x] > max) {
				max = grid[y][x];
			}
		}
	}
	return max;
}

function updatePNG(grid, disp, max, imgData) {
	const rows = grid.length;
	const cols = grid[0].length;
	
	// Calculate min based on max - use log to band
	const min = Math.trunc(Math.log10(max)) - bands;

	// Normalise 2d grid into bands by taking log
	for (let y=0; y<rows; y++) {
		for (let x=0; x<cols; x++) {
			if (grid[y][x] > 0.0) {
				disp[y][x] = Math.trunc(Math.log10(grid[y][x]));
			} else {
				disp[y][x] = min;
			}
		}
	}

	// Construct an image of the given width and height
	let i = 0;
	for (let y=0; y<rows; y++) {
		for (let x=0; x<cols; x++) {
			// Calculate offset as encoding in repeating blocks of RGBA
			i = (y * cols + x) * 4;
			
			// Default pixel set to white
			pixelR = 255;
			pixelG = 255;
			pixelB = 255;
			
			// Set shade of blue if concentration meets criteria
			if (disp[y][x] > min) {
				let conc = (disp[y][x] - min) / bands;
				pixelR = 255 - 255*conc;
				pixelG = 255 - 255*conc;
				pixelB = 255;
			}

			imgData.data[i] = pixelR;
			imgData.data[i+1] = pixelG;
			imgData.data[i+2] = pixelB;
			imgData.data[i+3] = 255;
		}
	}
}

function generatePNG(grid, disp, max) {
	// Cacuclate grid dimensions
	const rows = grid.length;
	const cols = grid[0].length;

	// Create temporary canvas
	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	let imgData = context.createImageData(cols, rows);

	canvas.height = rows;
	canvas.width = cols;
	
	// Update imgData array inplace with rendered image
	updatePNG(grid, disp, max, imgData);

	// put data to context at (0, 0)
	context.putImageData(imgData, 0, 0);

	// Return base64 encoded PNG image
	return canvas.toDataURL('image/png');
}

function exportPNG(data, target) {
	document.getElementById(target).src = data;
}
