import { Modal } from "./modal.js";
import { Colour } from "./colour.js";

export class FileModal extends Modal {
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