const sharp = require("sharp");

// -----------------------------------------------------
// CONSTANTS (UNCHANGED)
// -----------------------------------------------------
const ASCII_MAP = " .:-=+*#%@";
const BRAILLE_BITS = [
  [0,0,1],[1,0,2],
  [0,1,4],[1,1,8],
  [0,2,16],[1,2,32],
  [0,3,64],[1,3,128]
];

// -----------------------------------------------------
// HELPERS (UNCHANGED)
// -----------------------------------------------------
function rgbToHex([r,g,b]) {
  return (
    "#" +
    [r,g,b]
      .map(v => Math.max(0, Math.min(255, Math.round(v))))
      .map(v => v.toString(16).padStart(2,"0"))
      .join("")
  );
}

function luminance([r,g,b]) {
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

function dist2(a,b) {
  return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
}

// -----------------------------------------------------
// GENERATOR
// -----------------------------------------------------
async function generateAscii(imagePath, options = {}) {
  const USE_COLOR = !!options.color;
  const BRAILLE = !!options.braille;

  let WIDTH = options.width ?? null;
  let HEIGHT = options.height ?? null;
  let THRESHOLD = options.threshold ?? 128;

  THRESHOLD = Math.max(0, Math.min(255, THRESHOLD));

  let charW = WIDTH;
  let charH = HEIGHT;

  if (!charW && !charH) charW = 60;
  if (charW && !charH) charH = Math.round(charW * 0.5);
  if (charH && !charW) charW = Math.round(charH * 2);

  const pxW = BRAILLE ? charW * 2 : charW;
  const pxH = BRAILLE ? charH * 4 : charH;

  const { data } = await sharp(imagePath)
    .resize(pxW, pxH, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cells = [];
  const allColors = [];

  const stepX = BRAILLE ? 2 : 1;
  const stepY = BRAILLE ? 4 : 1;

  for (let y = 0; y < pxH; y += stepY) {
    const row = [];
    for (let x = 0; x < pxW; x += stepX) {
      let r=0,g=0,b=0,c=0,bits=0;

      for (let dy=0; dy<stepY; dy++) {
        for (let dx=0; dx<stepX; dx++) {
          const i=((y+dy)*pxW+(x+dx))*3;
          r+=data[i];
          g+=data[i+1];
          b+=data[i+2];
          c++;
        }
      }

      r/=c; g/=c; b/=c;
      const color=[r,g,b];
      allColors.push(color);

      let ch;
      if (BRAILLE) {
        BRAILLE_BITS.forEach(([dx,dy,bit]) => {
          const i=((y+dy)*pxW+(x+dx))*3;
          if (luminance([data[i],data[i+1],data[i+2]]) > THRESHOLD) {
            bits |= bit;
          }
        });
        ch = String.fromCharCode(0x2800 + bits);
      } else {
        const idx = Math.floor(
          (luminance(color)/255)*(ASCII_MAP.length-1)
        );
        ch = ASCII_MAP[idx];
      }

      row.push({ ch, color });
    }
    cells.push(row);
  }

  // ---------------------------------------------------
  // PALETTE
  // ---------------------------------------------------
  allColors.sort((a,b)=>luminance(a)-luminance(b));
  const palette=[];
  for (let i=0;i<9;i++) {
    palette.push(allColors[Math.floor(i/8*(allColors.length-1))]);
  }

  // ---------------------------------------------------
  // RENDER OUTPUT (FIXED LINE HERE)
  // ---------------------------------------------------
  let output = "";

  for (const row of cells) {
    let out="", last=null;
    for (const cell of row) {
      let idx = 0;
      let best = dist2(cell.color, palette[0]);

      for (let i=1;i<9;i++) {
        const d = dist2(cell.color, palette[i]); // ✅ FIXED
        if (d < best) {
          best = d;
          idx = i;
        }
      }

      if (USE_COLOR && idx !== last) {
        out += `$${idx+1}`;
        last = idx;
      }
      out += cell.ch;
    }
    output += out + "\n";
  }

  if (USE_COLOR) {
    output += "\n--- FASTFETCH PALETTE ---\n{\n";
    palette.forEach((c,i)=>{
      output += `  "${i+1}": "${rgbToHex(c)}"${i<8?",":""}\n`;
    });
    output += "}\n";
  }

  return {
    ascii: output.trimEnd(),
    palette: USE_COLOR ? palette.map(rgbToHex) : null
  };
}

module.exports = { generateAscii };
