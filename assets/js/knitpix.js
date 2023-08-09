import { Colour } from "./knit-colour.js";

class Modal {
  constructor(openButtonId, confirmButtonId, dialogId) {
    this.openButton = document.getElementById(openButtonId);
    this.confirmButton = document.getElementById(confirmButtonId);
    this.dialog = document.getElementById(dialogId);

    this.openButton.onclick = this.open.bind(this);
    this.confirmButton.onclick = this.complete.bind(this);
  }

  open() {
    this.dialog.showModal();
  }

  complete(e) {
    e.preventDefault();
    this.dialog.close(this.confirmButton.value);
  }
}

class ClearModal extends Modal {
  constructor(onClear) {
    super("clear-all-btn", "clear-dlg-confirm", "clear-dlg");
    this.onClear = onClear;
    this.dialog.onclose = this.dialogClosed.bind(this);
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    this.onClear();
  }
}

class NewModal extends Modal {
  constructor(onNew) {
    super("new-btn", "new-dlg-confirm", "new-dlg");
    this.width = document.getElementById("new-dlg-width-input");
    this.height = document.getElementById("new-dlg-height-input");

    this.onNew = onNew;
    this.dialog.onclose = this.dialogClosed.bind(this);
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    this.onNew(this.width.value, this.height.value);
  }
}

class DocumentModal extends Modal {
  constructor(width, height, onDone) {
    super("document-btn", "document-dlg-confirm", "document-dlg");
    this.width = document.getElementById("document-size-width-input");
    this.width.value = width;
    this.height = document.getElementById("document-size-height-input");
    this.height.value = height;

    this.onDone = onDone;
    this.dialog.onclose = this.dialogClosed.bind(this);
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    this.onDone(Number.parseInt(this.width.value), Number.parseInt(this.height.value));
  }
}

class FileModal extends Modal {
  constructor(onFileChosen) {
    super("open-file-btn", "open-file-dlg-confirm", "open-file-dlg");
    this.input = document.getElementById("open-file-dlg-input");
    this.width = document.getElementById("open-file-dlg-width-input");
    this.height = document.getElementById("open-file-dlg-height-input");
    this.preview = document.getElementById("open-file-dlg-preview");
    this.reference = document.getElementById("open-file-dlg-reference");
    this.colourCount = document.getElementById("open-file-dlg-colour-count-input");
    this.spinner = document.getElementById("open-file-dlg-spinner");
    this.palette = [new Colour(0, 0, 0, 0)];

    this.input.onchange = this.fileChanged.bind(this);
    this.dialog.onclose = this.dialogClosed.bind(this);
    this.reference.onload = this.referenceLoaded.bind(this);
    this.width.onchange = this.sizeChanged.bind(this);
    this.height.onchange = this.sizeChanged.bind(this);
    this.colourCount.onchange = this.coloursChanged.bind(this);
    this.onFileChosen = onFileChosen;
    this.sizeChanged();
  }

  fileChanged(e) {
    const url = this.input.files.length > 0 ? URL.createObjectURL(this.input.files[0]) : undefined;
    this.reference.onload = this.referenceLoaded.bind(this);
    this.reference.src = url;
    this.confirmButton.value = url;
  }

  sizeChanged() {
    this.preview.width = this.width.value;
    this.preview.height = this.height.value;
    this.pixelizePreview();
  }

  coloursChanged() {
    this.calculatePalette().then(this.pixelizePreview.bind(this));
  }

  calculatePalette() {
    this.spinner.style.display = 'block';

    return new Promise((resolve) => {
      window.setTimeout(() => {
        const sourceWidth = this.reference.naturalWidth > 0 ? this.reference.naturalWidth : 1;
        const sourceHeight = this.reference.naturalHeight > 0 ? this.reference.naturalHeight : 1;
        const colourCanvas = new OffscreenCanvas(sourceWidth, sourceHeight);
        const colour = colourCanvas.getContext('2d');
        colour.drawImage(this.reference, 0, 0);
        colour.closePath();
        const colourData = colour.getImageData(0, 0, sourceWidth, sourceHeight);
        const colourRgba = Colour.toRgba(colourData.data);
        this.palette = Colour.colourQuantization(colourRgba, this.colourCount.value);
        // console.log(this.palette);
  
        this.spinner.style.display = 'none';
        resolve();
      }, 500);
    });
  }

  pixelizePreview() {
    const width = this.width.value;
    const height = this.height.value;

    const pixelCanvas = new OffscreenCanvas(width, height);
    const pix = pixelCanvas.getContext('2d');
    pix.imageSmoothingEnabled = false;
    pix.drawImage(this.reference, 0, 0, this.reference.naturalWidth, this.reference.naturalHeight, 0, 0, width, height);
    pix.closePath();
    const pixelData = pix.getImageData(0, 0, width, height);
    const pixels = Colour.toRgba(pixelData.data);
    const mapped = Colour.mapToNearest(pixels, this.palette);
    const palettizedImage = new ImageData(Colour.toData(mapped), pixelData.width);
    
    const ctx = this.preview.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(palettizedImage, 0, 0);
    ctx.closePath();
  }

  referenceLoaded() {
    this.calculatePalette().then(this.pixelizePreview.bind(this));
  }

  getData() {
    const ctx = this.preview.getContext('2d');
    return ctx.getImageData(0, 0, this.width.value, this.height.value).data;
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    this.onFileChosen(this.getData(), Number.parseInt(this.width.value), Number.parseInt(this.height.value), this.palette);
  }
}

class Tools {
  static PENCIL = "pencil";
  static BUCKET = "bucket";

  constructor(onColourChanged, onToolChanged) {
    this.colour = document.getElementById("colour-input");
    this.pencil = document.getElementById("tool-pencil");
    this.bucket = document.getElementById("tool-bucket");
    this.onColourChanged = onColourChanged;
    this.onToolChanged = onToolChanged;

    this.colour.onchange = this.colourChanged.bind(this);
    this.colourChanged();
    this.pencil.onchange = this.toolChanged.bind(this);
    this.bucket.onchange = this.toolChanged.bind(this);
  }

  colourChanged() {
    this.onColourChanged(this.colour.value);
  }

  toolChanged() {
    this.onToolChanged(this.pencil.checked ? Tools.PENCIL : Tools.BUCKET);
  }
}

class Palette {
  constructor(palette, onColourChanged) {
    this.onColourChanged = onColourChanged;
    this.palette = document.getElementById("colour-palette");
    this.template = document.getElementById("colour-palette-colour");
    this.colours = new Set(palette);
    this.colour = "";
  }

  colourChanged(e) {
    const input = e.target;
    if (input.checked) {
      this.colour = input.value;
      this.onColourChanged(this.colour);
    }
  }

  changeColour(newColour) {
    this.colours.add(newColour);
    this.colour = newColour;
    this.renderColours();
  }

  renderColours() {
    const chips = Array.from(this.palette.getElementsByClassName("colour-palette-chip"));
    this.colours.forEach(colour => {
      let chip = chips.find(e => e.textContent === colour);
      if (!chip) {
        const template = this.template.content.cloneNode(true);
        const label = template.querySelector("label");
        label.setAttribute('for', colour);
        const inner = template.querySelector("span")
        inner.textContent = colour;
        inner.style.background = colour;
        const input = template.querySelector("input");
        input.onchange = this.colourChanged.bind(this);
        input.value = colour;
        input.id = colour;
        this.palette.appendChild(template);
      }
      // if (colour === this.colour) {
      //   chip.getAttribute("for").querySelectorAll("input").forEach(i => i.checked = true);
      // }
    });
    document.getElementById(this.colour).checked = true;
  }
}

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
    while(pixelStack.length > 0) {
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

  resize(width, height) {
    if (this.stitchCount != width) { 
      const change = (width - this.stitchCount);
      for (let row = 0; row < this.rowCount; row++) {
        if (change > 0) {
          for (let stitch = 0; stitch < change; stitch++) {
            this.data[row].push([0,0,0,0]);
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
            row.push([0,0,0,0]);
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
        row.push([0,0,0,0]);
      }
      this.data.push(row);
    }
  }

}

class Storage {
  saveDataKey = "saveData";
  constructor() { }

  save(data) {
    window.localStorage.setItem(Storage.saveDataKey, JSON.stringify(data));
  }

  load() {
    return JSON.parse(window.localStorage.getItem(Storage.saveDataKey));
  }
}

class History {
  constructor(setData, getData) { 
    this.clear();

    this.undoButton = document.getElementById("undo-btn");
    this.redoButton = document.getElementById("redo-btn");
    this.undoButton.onclick = this.undo.bind(this);
    this.redoButton.onclick = this.redo.bind(this);

    this.setData = setData;
    this.getData = getData;
    this.updateButtons();
    this.current = JSON.stringify(getData());
  }

  save(data) {
    this.previous.push(this.current);
    this.current = JSON.stringify(data);
    this.next = [];
    this.updateButtons();
  }

  clear() {
    this.previous = [];
    this.next = [];
  }

  updateButtons() {
    this.undoButton.disabled = this.previous.length === 0;
    this.redoButton.disabled = this.next.length === 0;
  }

  undo() {
    const data = this.previous.pop();
    if (data) {
      this.next.push(JSON.stringify(this.getData()));
      this.setData(JSON.parse(data));
    }
    this.updateButtons();
  }

  redo() {
    const data = this.next.pop();
    if (data) {
      this.previous.push(JSON.stringify(this.getData()));
      this.setData(JSON.parse(data));
    }
    this.updateButtons();
  }
}

class Export {
  constructor() {
    document.getElementById("download-btn").onclick = Export.export;
  }

  static export() {
    var fileContent = document.getElementById("swatch").outerHTML;
    var bb = new Blob([fileContent ], { type: 'image/svg+xml' });
    var a = document.createElement('a');
    a.download = 'export.svg';
    a.href = window.URL.createObjectURL(bb);
    a.click();
    a.remove();
  }
}

const storage = new Storage();
const exp = new Export();
let onSave = (data) => {
  storage.save(data);
};

const swatch = new Swatch((data) => {
  onSave(data);
}, storage.load());

const palette = new Palette(Colour.rgbaToPalette(swatch.data), (hex) => {
  swatch.currentColor = Colour.fromHex(hex);
});

new Tools((hex) => {
  swatch.currentColor = Colour.fromHex(hex);
  palette.changeColour(hex);
}, (tool) => {
  swatch.currentTool = tool;
});

const history = new History((data) => {
  swatch.data = data;
  swatch.draw();
  storage.save(data);
}, () => swatch.data);
onSave = (data) => {
  history.save(data);
  storage.save(data);
}

const documentModal = new DocumentModal(swatch.stitchCount, swatch.rowCount, (width, height) => {
  swatch.resize(width, height);
  swatch.draw();
});
documentModal.width.value = swatch.stitchCount;
documentModal.height.value = swatch.rowCount;

new FileModal((data, width, height, colours) => {
  swatch.stitchCount = width;
  swatch.rowCount = height;
  swatch.clear();
  const newData = [];
  for (let i = 0; i < height; i++) {
    const offset = i * width * 4;
    const row = Array.from(data.slice(offset, offset + (width * 4)));
    const newRow = [];
    for (let j = 0; j < width; j++) {
      const pixelOffset = j * 4;
      const pixel = Array.from(row.slice(pixelOffset, pixelOffset + 4));
      newRow.push(pixel);
    }
    newData.push(newRow);
  }
  swatch.data = newData;
  palette.colours = colours.map(c => c.toHex());
  palette.renderColours();
  swatch.draw();
  documentModal.height.value = height;
  documentModal.width.value = width;
});

new NewModal((width, height) => {
  swatch.stitchCount = width;
  swatch.rowCount = height;
  swatch.clear();
  swatch.draw();
});

new ClearModal(() => {
  swatch.clear();
  history.clear();
  storage.save(swatch.data);
  swatch.draw();
});

