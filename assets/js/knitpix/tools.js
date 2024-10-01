export class Tools {
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