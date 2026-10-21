import fs from 'fs';

const buf = fs.readFileSync('src/assets/download.png');
// PNG header is 8 bytes.
// IHDR chunk: length 4 bytes, chunk type 'IHDR' 4 bytes, width 4 bytes, height 4 bytes,
// bit depth 1 byte, color type 1 byte (0=grayscale, 2=RGB, 3=Indexed, 4=Grayscale+Alpha, 6=RGBA)
const colorType = buf[25];
console.log('Color type:', colorType, '(6 = RGBA, 2 = RGB)');
