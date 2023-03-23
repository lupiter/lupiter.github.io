const hex = d => Number(d).toString(16).padStart(2, '0');

class Colour {
  constructor(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.rdec = red / 255;
    this.gdec = green / 255;
    this.bdec = blue / 255;
  }
  get min() {
    if (this._min === undefined) {
      this._min = Math.min(this.rdec, this.gdec, this.bdec);
    }
    return this._min;
  }
  get max() {
    if (this._max === undefined) {
      this._max = Math.max(this.rdec, this.gdec, this.bdec);
    }
    return this._max;
  }
  get hue() {
    if (this._hue === undefined) {
      let h;
      if (this.max === this.min) {
        h = 0
      } else if (this.max === this.rdec) {
        h = (this.gdec - this.bdec) / (this.max - this.min) % 6;
      } else if (this.max === this.bdec) {
        h = 2.0 + (this.rdec - this.gdec) / (this.max - this.min);
      } else {
        h = 4.0 + (this.bdec - this.rdec) / (this.max - this.min);
      }
      h = (h * 60) % 360;
      if (h < 0) {
        h = h + 360;
      }
      
      this._hue = Math.round(h);
      if (Number.isNaN(this._hue)) {
        console.error(this._hue, this._min, this._max, this._saturation, this._luminance);
      }
    }
    
    return this._hue;
  }
  get saturation() {
    if (this._saturation === undefined) {
      const l = this.luminance;
      if (l === 0 || l === 1) {
        this._saturation = 0;
      } else {
        this._saturation = (this.max - l) / Math.min(l, 1 - l)
      }
    }
    return this._saturation;
  }
  get luminance() {
    if (this._luminance === undefined) {
      this._luminance = (this.min + this.max) / 2;
    }
    return this._luminance;
  }
  get hex() {
    if (this._hex === undefined) {
      this._hex = '#' + hex(this.red) + hex(this.green) + hex(this.blue);
    }
    return this._hex;
  }
  get safer() {
    if (this.red % 5 === 0 && this.green % 5 === 0 && this.blue % 5 === 0) {
      return this;
    }
    return new Colour(
      Math.round(this.red / 5) * 5,
      Math.round(this.green / 5) * 5,
      Math.round(this.blue / 5) * 5
    );
  }
}

function hexToRgb(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return new Colour(r, g, b);
}

function hslToRgb(hsl) {
  const h = hsl[0];
  const s = hsl[1];
  const l = hsl[2];
  
  if (s === 0) {
    const r = l * 255;
    return new Colour(r, r, r);
  }

  const a = s * Math.min(l, 1 - l);
  fn = (n) => {
    const k = ( n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }

  return new Colour(fn(0) * 255, fn(8) * 255, fn(4) * 255);
}

const baseIn = document.getElementById("base");
const hueIn = document.getElementById("hues");
const shadeIn = document.getElementById("shades");
const shiftIn = document.getElementById("shift");
const generateBtn = document.getElementById("generate");
const main = document.getElementById("main");

const warm = 20;
const cool = 260;

const bendHue = (h, strength, target) => {
  if (Math.abs(h - target) < 180) {
    return h - (h - target) * strength;
  }
  return h - (h - 360 - target) * strength;
}

const generate = () => {
  main.textContent = '';
	const base = hexToRgb(baseIn.value.slice(1));
  const hues = hueIn.value;
  const shades = shadeIn.value;
  const shift = shiftIn.value;
  const clamped = base.safer;
  const hue_increments = 360 / hues;

  const shade_increments = [];
  const shade_count = Math.round(shades / 2);
  for (let i = 1; i <= shades; i++) {
    if (i <= shades / 2) {
      shade_increments.push([
        shift / shade_count * i,
        cool,
        clamped.saturation / (shade_count) * i,
        clamped.luminance / (shade_count) * i
      ])
    } else if ((i - 1) / (shades - 1) === 0.5) {
      shade_increments.push([
        0,
        cool,
        clamped.saturation, 
        clamped.luminance
      ])
    } else {
      shade_increments.push([
        shift / shade_count * (i - shade_count),
        warm,
        ((1 - clamped.saturation) / (shade_count * (i - shade_count))) + clamped.saturation,
        ((1 - clamped.luminance) / (shade_count * (i - shade_count))) + clamped.luminance,
      ])
    }
  }
  console.log(shade_increments);

  const palette = [];
  const table = document.createElement("table");

  for (let i = 0; i < hues; i++) {
  	const hue = clamped.hue + (i * hue_increments);
    const set = shade_increments.map(x => {
      return [bendHue(hue, x[0], x[1]), x[2], x[3]]
    })
    //  [
    //   [bendHue(hue, shift, cool), sat_low, shade_low],
    //   [hue, clamped.saturation, clamped.luminance],
    //   [bendHue(hue, shift, warm), sat_high, shade_high]
    // ]
    .map(x => hslToRgb(x).safer);
    console.log(set.map(x => x.hue));
  	palette.push(set);
    const row = document.createElement("tr");
    set.forEach(x => {
      const cell = document.createElement("td");
      cell.style.background = x.hex;
      row.append(cell);
    })
    table.append(row);
  }
  main.append(table);
  

}
baseIn.onchange = generate;
hueIn.onchange = generate;
shadeIn.onchange = generate;
shiftIn.onchange = generate;
generateBtn.onclick = generate;

function generateAll() {
  let colours = [];

  for (let r = 0; r < 256; r++) {
    for (let g = 0; g < 256; g++) {
      for (let b = 0; b < 256; b++) {
        const gbcSafe = r % 5 === 0 && g % 5 === 0 && b % 5 === 0;
        if (gbcSafe) {
          colours.push(new Colour(r, g, b));
        }
      }
    }
  }


  colours.sort((a, b) => {
    return a.saturation - b.saturation;
  });
  colours.sort((a, b) => {
    return a.luminance - b.luminance;
  });
  colours.sort((a, b) => {
    return a.hue - b.hue;
  });

  var lastHue = colours[0].hue;
  console.log(lastHue);
  var row = document.createElement("tr");
  for (colour of colours) {
    const cell = document.createElement("td");
    cell.textContent = ' ';
    cell.dataset['hue'] = colour.hue;
    cell.style.background = colour.hex;
    row.append(cell);
    if (lastHue != colour.hue) {
      main.append(row);
      row = document.createElement("tr");
      lastHue = colour.hue;
    }
  }
  main.append(row);
}