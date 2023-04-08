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
  static random() {
    let r = Math.round(Math.random() * 255);
    let g = Math.round(Math.random() * 255);
    let b = Math.round(Math.random() * 255);
    return new Colour(r, g, b);
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
  static fromHex(hex) {
    var bigint = parseInt(hex.slice(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
  
    return new Colour(r, g, b);
  }
  static fromHSL(hsl) {
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
}

function readHash() {
  let hash = window.location.hash;
  if (!hash) {
    return [];
  }
  return hash.split(',').map(x => Colour.fromHex(x));
}

function writeHash(colours) {
  let hash = colours.map(c => c.hex).join(",");
  window.location.hash = hash;
}

const MAX_COLOURS = 32;
const MIN_COLOURS = 8;

function generateRandom() {
  let main = document.getElementById("main");
  let locked = readHash();
  let colours = locked.slice();
  
  let generate = Math.min(MIN_COLOURS, MAX_COLOURS - locked.length);
  for (let i = locked.length - 1; i < generate; i++) {
    colours.push(Colour.random().safer);
  }

  colours.forEach(colour => {
    let label = document.createElement('label');
    let check = document.createElement('input');
    check.type = 'checkbox';
    if (locked.includes(colour)) {
      check.checked = true;
    }
    label.textContent = colour.hex;
    label.style.background = colour.hex;
    label.className = 'chip';
    check.onchange = () => {
      if (check.checked) {
        locked.push(colour);
      } else {
        let idx = locked.indexOf(colour);
        if (idx >= 0) {
          locked.splice(idx, 1);
        }
      }
      writeHash(locked);
    };
    label.appendChild(check);
    main.appendChild(label);
  })
}

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

generateRandom();