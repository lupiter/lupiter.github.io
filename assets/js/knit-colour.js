export class Colour {
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static toRgba(data) {
    var palette = [],
        i = 0,
        n = data.length;
  
  
    while (i < n) {
      const colourData = data.slice(i, i += 4);
      const colour = new Colour(
        colourData[0],
        colourData[1],
        colourData[2],
        colourData[3]
      )
      palette.push(colour);
    }
    return palette;
  }

  static toData(rgba) {
    var data = new Uint8ClampedArray(rgba.length * 4);
    for (let i = 0; i < rgba.length; i++) {
      const colour = rgba[i]._toData();
      data[i*4] = colour[0], 
      data[i*4+1] = colour[1], 
      data[i*4+2] = colour[2], 
      data[i*4+3] = colour[3];
    }
    return data;
  }
  
  static colourQuantization(rgba, count) {
    const unique = rgba; // Array.from(new Map(rgba.map(c => [c.toHex(), c])).values())

    var i = 1,
    n = count,
    buckets = [unique];
  
    while (i < n) {
      buckets.sort((first, second) => {
        return Colour._paletteRange(first)._maxColour() - Colour._paletteRange(second)._maxColour();
      });
      const split = Colour._splitBucket(buckets[0]);
      buckets.reverse()
      buckets.pop();
      buckets.push(split[0], split[1]);
      i += 1;
    }
    
    return buckets.map(bucket => Colour._averageColour(bucket));
  }

  static mapToNearest(rgba, palette) {
    return rgba.map(colour => colour._mapToNearest(palette));
  }

  static fromHex(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return new Colour(
      r, g, b,
      255,
    );
  }
  

  toHex() {
    return '#' + Colour._hex(this.r) + Colour._hex(this.g) + Colour._hex(this.b);
  }

  toRgba() {
    return `(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  equal(other) {
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }


  static _paletteRange(palette) {
    const min = (x, y) => x < y ? x : y;
    const max = (x, y) => x > y ? x : y;
    const minimum = new Colour(palette.map(c => c.r).reduce(min), palette.map(c => c.g).reduce(min), palette.map(c => c.b).reduce(min), palette.map(c => c.a).reduce(min)),
      maxiumum = new Colour(palette.map(c => c.r).reduce(max), palette.map(c => c.g).reduce(max), palette.map(c => c.b).reduce(max), palette.map(c => c.a).reduce(max));
    return new Colour(maxiumum.r - minimum.r, maxiumum.g - minimum.g, maxiumum.b - minimum.b, maxiumum.a - minimum.a);
  }
  
  static _splitBucket(palette) {
    const range = Colour._paletteRange(palette);
      
    if (range.r > range.b && range.r > range.g) {
      palette.sort((first, second) => first.r - second.r);  
    } else if (range.b > range.r && range.b > range.g) {
      palette.sort((first, second) => first.b - second.b);
    } else {
      palette.sort((first, second) => first.g - second.g);
    }
    const middle = Math.round(palette.length / 2);
  
    return [palette.slice(0, middle), palette.slice(middle, palette.length)];
  }

  static _averageColour(palette) {
    // mean is a bit ugly, let's try median instead
    const r = palette.map(c => c.r).sort(),
      g = palette.map(c => c.g).sort(),
      b = palette.map(c => c.b).sort(),
      a = palette.map(c => c.a).sort(),
      mid = Math.round(palette.length / 2);
    return new Colour(
      r[mid], g[mid], b[mid], a[mid]
    );
  }

  static _hex(d) {
    return Number(d).toString(16).padStart(2, '0');
  }
  
  
  _maxColour() {
    return Math.max(this.r, this.b, this.g);
  }

  _toData() {
    var data = new Uint8ClampedArray(4);
    data[0] = this.r;
    data[1] = this.g;
    data[2] = this.b;
    data[3] = this.a;
    return data;
  }
  
  _distance(other) {
    return Math.sqrt(Math.pow(this.r - other.r, 2) + Math.pow(this.g - other.g, 2) + Math.pow(this.b - other.b, 2) + Math.pow(this.a - other.a, 2));
  }
  
  _mapToNearest(palette) {
    return palette.reduce((prev, curr) => {
      const p = this._distance(prev);
      const c = this._distance(curr);
      if (p <= c) {
        return prev;
      }
      return curr;
    });
  }
}