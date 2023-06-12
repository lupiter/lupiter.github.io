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
    this.gaugeWidth = document.getElementById("document-gauge-width-input");
    this.gaugeHeight = document.getElementById("document-gauge-height-input");

    this.onDone = onDone;
    this.dialog.onclose = this.dialogClosed.bind(this);
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    const aspectRatio = this.gaugeHeight.value / this.gaugeWidth.value;
    this.onDone(this.width.value, this.height.value, aspectRatio);
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
    this.onFileChosen(this.getData(), this.width.value, this.height.value, this.palette);
  }
}

class Tools {
  constructor(onColourChanged) {
    this.colour = document.getElementById("colour-input");
    this.onColourChanged = onColourChanged;

    this.colour.onchange = this.colourChanged.bind(this);
    this.colourChanged();
  }

  colourChanged() {
    this.onColourChanged(this.colour.value);
  }
}

class Palette {
  constructor(onColourChanged) {
    this.onColourChanged = onColourChanged;
    this.palette = document.getElementById("colour-palette");
    this.template = document.getElementById("colour-palette-colour");
    this.colours = new Set();
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
        chip = template.querySelector("label");
        chip.style.background = colour;
        chip.querySelector("span").textContent = colour;
        const input = chip.querySelector("input");
        input.onchange = this.colourChanged.bind(this);
        input.value = colour;
        this.palette.appendChild(template);
      }
      if (colour === this.colour) {
        chip.querySelectorAll("input").forEach(i => i.checked = true);
      }
    });
  }
}

class Swatch {
  constructor() {
    this.root = document.getElementById("swatch");
    this.rowCount = 10;
    this.stitchCount = 10;
    this.aspectRatio = 1.33;

    const canvas = new OffscreenCanvas(this.stitchCount, this.rowCount);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.data = ctx.getImageData(0, 0, this.stitchCount, this.rowCount).data;

    this.draw();
  }

  addSymbols() {
    const symbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    symbol.id = "knit";
    symbol.setAttribute("preserveAspectRatio", "none");
    symbol.setAttribute("viewBox", "0 0 20 20");
    const knit = document.createElementNS("http://www.w3.org/2000/svg", "path"); 
    // knit.setAttribute("d", "m 0,15 10,5 10,-5 V 0 L 10,5 0,0 Z"); // use inkscape, filet corners by 8px
    knit.setAttribute("d", "m 1.8932043,15.946602 6.2135914,3.106796 a 4.2333334,4.2333334 180 0 0 3.7864083,0 l 6.213592,-3.106796 A 3.4248387,3.4248387 121.71747 0 0 20,12.883333 V 2.1166667 A 1.308172,1.308172 31.717474 0 0 18.106796,0.94660213 L 11.893204,4.0533979 a 4.2333334,4.2333334 0 0 1 -3.7864083,0 L 1.8932043,0.94660213 A 1.308172,1.308172 148.28253 0 0 0,2.1166667 V 12.883333 a 3.4248387,3.4248387 58.282526 0 0 1.8932043,3.063269 z")
    symbol.appendChild(knit);
    this.root.appendChild(symbol);
  }

  draw() {
    const svg = "http://www.w3.org/2000/svg";
    this.root.innerHTML = '';
    this.root.setAttribute("viewBox", `0 0 ${this.stitchCount * this.aspectRatio * 20} ${this.rowCount * 20}`)
    this.addSymbols();
    for (let row = 0; row < this.rowCount; row++) {
      const group = document.createElementNS(svg, "g");
      group.setAttribute("class", "row");
      for (let stitchNo = 0; stitchNo < this.stitchCount; stitchNo++) {
        const stitch = document.createElementNS(svg, "use");
        stitch.setAttribute("href", "#knit");
        stitch.setAttribute("x", stitchNo * 20 * this.aspectRatio);
        stitch.setAttribute("y", row * 20);
        stitch.setAttribute("width", this.aspectRatio * 20);
        stitch.setAttribute("height", 20);
        const offset = row * this.stitchCount + stitchNo;
        const pixel = this.data.slice(offset * 4, offset * 4 + 4);
        const rgba = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;
        stitch.setAttribute("fill", rgba);

        stitch.onclick = () => this.stitchChange(offset, stitch);
        stitch.onmouseenter = (e) => {
          if (e.buttons > 0) {
            this.stitchChange(offset, stitch)
          }
        }

        group.appendChild(stitch);
      }
      this.root.appendChild(group);
    }
  }

  stitchChange(offset, stitch) {
    const { r, g, b, a } = this.currentColor;
    this.data[offset] = r;
    this.data[offset + 1] = g;
    this.data[offset + 2] = b;
    this.data[offset + 3] = a;
    const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
    stitch.setAttribute("fill", rgba);
  }

}

const swatch = new Swatch();

const palette = new Palette((hex) => {
  swatch.currentColor = Colour.fromHex(hex);
});

new Tools((hex) => {
  swatch.currentColor = Colour.fromHex(hex);
  palette.changeColour(hex);
});

const documentModal = new DocumentModal(swatch.stitchCount, swatch.rowCount, (width, height, aspectRatio) => {
  swatch.aspectRatio = aspectRatio;
  swatch.stitchCount = width;
  swatch.rowCount = height;
  swatch.draw();
});

new FileModal((data, width, height, colours) => {
  swatch.stitchCount = width;
  swatch.rowCount = height;
  swatch.data = data;
  palette.colours = colours.map(c => c.toHex());
  palette.renderColours();
  swatch.draw();
  documentModal.height.value = height;
  documentModal.width.value = width;
});

new NewModal((width, height) => {
  swatch.stitchCount = width;
  swatch.rowCount = height;
  swatch.data = new Array(4 * width * height);
  swatch.draw();
});

new ClearModal(() => {
  swatch.data = new Array(4 * swatch.rowCount * swatch.stitchCount);
  swatch.draw();
});

