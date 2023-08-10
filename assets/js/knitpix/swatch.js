import { Tools } from "./tools.js";
import { Colour } from "./colour.js";

export class Swatch {
  constructor(save, data) {
    this.root = document.getElementById("swatch");
    this.rowCount = 24;
    this.stitchCount = 24;
    this.save = save;
    this.currentTool = Tools.PENCIL;

    if (data) {
      this.data = data;
      this.rowCount = this.data.length;
      this.stitchCount = this.data.length > 0 ? this.data[0].length : 0;
    } else {
      this.clear();
    }
    this.draw();
  }

  addSymbols() {
    const symbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    symbol.id = "knit";
    symbol.setAttribute("preserveAspectRatio", "none");
    symbol.setAttribute("viewBox", "0 0 20 20");
    const knit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // knit.setAttribute("d", "m 0,16 10,4 10,-4 V 0 L 10,4 0,0 Z"); // use inkscape, filet corners by 8px
    knit.setAttribute("d", "m 1.9652757,16.78611 6.0694486,2.42778 a 5.2916668,5.2916668 0 0 0 3.9305517,0 l 6.069448,-2.42778 A 3.1263865,3.1263865 124.0993 0 0 20,13.883333 V 2.1166667 A 1.4330531,1.4330531 34.099295 0 0 18.034724,0.78611028 L 11.965276,3.2138897 a 5.2916667,5.2916667 0 0 1 -3.9305517,0 L 1.9652757,0.78611028 A 1.4330531,1.4330531 145.9007 0 0 0,2.1166667 V 13.883333 a 3.1263865,3.1263865 55.900705 0 0 1.9652757,2.902777 z")
    symbol.appendChild(knit);
    this.root.appendChild(symbol);
  }

  draw() {
    const svg = "http://www.w3.org/2000/svg";
    this.root.innerHTML = '';
    this.root.setAttribute("viewBox", `0 0 ${this.stitchCount * 20} ${this.rowCount * 16 + 4}`)
    this.addSymbols();
    for (let row = 0; row < this.rowCount; row++) {
      const group = document.createElementNS(svg, "g");
      group.setAttribute("class", "row");
      for (let stitchNo = 0; stitchNo < this.stitchCount; stitchNo++) {
        const stitch = document.createElementNS(svg, "use");
        stitch.setAttribute("href", "#knit");
        stitch.setAttribute("x", stitchNo * 20);
        stitch.setAttribute("y", row * 16);
        stitch.setAttribute("width", 20);
        stitch.setAttribute("height", 20);
        const pixel = this.data[row][stitchNo];
        const rgba = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;
        stitch.setAttribute("fill", rgba);

        stitch.touchstart = () => this.stitchChange(row, stitchNo, stitch);
        stitch.touchmove = () => this.stitchChange(row, stitchNo, stitch);
        stitch.touchend = () => this.stitchChange(row, stitchNo, stitch);
        stitch.onmousedown = () => this.stitchChange(row, stitchNo, stitch);
        stitch.onmouseenter = (e) => {
          if (e.buttons > 0) {
            this.stitchChange(row, stitchNo, stitch)
          }
        }

        group.appendChild(stitch);
      }
      this.root.appendChild(group);
    }
  }

  stitchChange(row, stitchNo, stitch) {
    if (this.currentTool === Tools.BUCKET) {
      this.floodFill(row, stitchNo);
    } else {
      const { r, g, b, a } = this.currentColor;
      this.data[row][stitchNo] = [r, g, b, a];
      const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
      stitch.setAttribute("fill", rgba);
    }
    this.save(this.data);
  }

  floodFill(startRow, startStitch) {
    // Credit: Tom Cantwell https://cantwell-tom.medium.com/flood-fill-and-line-tool-for-html-canvas-65e08e31aec6

    let pixel = this.data[startRow][startStitch];
    // exit if color is the same
    const { r, g, b, a } = this.currentColor;
    const newColor = [r, g, b, a];
    if ([r, g, b, a] === pixel) {
      return;
    }

    const matchStartColor = (row, stitch) => {
      let col = this.data[row][stitch];
      return JSON.stringify(col) === JSON.stringify(pixel);
    }

    let pixelStack = [[startStitch, startRow]];
    let width = this.stitchCount;
    let height = this.rowCount;
    let newPos, stitch, row, reachLeft, reachRight;
    while (pixelStack.length > 0) {
      newPos = pixelStack.pop();
      stitch = newPos[0];
      row = newPos[1]; // get current pixel position
      // Go up as long as the color matches and are inside the canvas
      while (row >= 0 && matchStartColor(row, stitch)) {
        row--;
      }
      // Don't overextend
      row++;
      reachLeft = false;
      reachRight = false;
      // Go down as long as the color matches and in inside the canvas

      while (row < height && matchStartColor(row, stitch)) {
        this.data[row][stitch] = newColor;
        if (stitch > 0) {
          if (matchStartColor(row, stitch - 1)) {
            if (!reachLeft) {
              //Add pixel to stack
              pixelStack.push([stitch - 1, row]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        } if (stitch < width - 1) {
          if (matchStartColor(row, stitch + 1)) {
            if (!reachRight) {
              // Add pixel to stack
              pixelStack.push([stitch + 1, row]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }
        row++;
      }
      if (pixelStack.length > this.stitchCount * this.rowCount) {
        throw new Error("that's fucked");
      }
    }
    this.draw();
  }

  swapColor(from, to) {
    for (let row = 0; row < this.rowCount; row++) {
      for (let stitch = 0; stitch < this.stitchCount; stitch++) {
        const current = Colour.fromRgba(this.data[row][stitch])
        if (current.equal(from)) {
          this.data[row][stitch] = to.toArray();
        }
      }
    }
    this.draw();
  }

  resize(width, height) {
    if (this.stitchCount != width) {
      const change = (width - this.stitchCount);
      for (let row = 0; row < this.rowCount; row++) {
        if (change > 0) {
          for (let stitch = 0; stitch < change; stitch++) {
            this.data[row].push([0, 0, 0, 0]);
          }
        } else {
          this.data[row] = this.data[row].slice(0, this.stitchCount + change);
        }
      }
      this.stitchCount = width;
    }
    if (this.rowCount != height) {
      const change = (height - this.rowCount);
      if (change > 0) {
        for (let row = 0; row < change; row++) {
          const row = [];
          for (let stitch = 0; stitch < this.stitchCount; stitch++) {
            row.push([0, 0, 0, 0]);
          }
          this.data.push(row);
        }
      } else {
        this.data = this.data.slice(0, this.rowCount + change);
      }
      this.rowCount = height;
    }
  }

  clear() {
    this.data = [];
    for (let row = 0; row < this.rowCount; row++) {
      const row = [];
      for (let stitch = 0; stitch < this.stitchCount; stitch++) {
        row.push([0, 0, 0, 0]);
      }
      this.data.push(row);
    }
  }

}