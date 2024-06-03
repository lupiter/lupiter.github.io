import { Colour } from "./knitpix/colour.js";
import { Swatch } from "./knitpix/swatch.js"
import { History } from "./knitpix/history.js";
import { Modal } from "./knitpix/modal.js";
import { FileModal } from "./knitpix/file-modal.js";
import { Palette } from "./knitpix/palette.js";
import { Tools } from "./knitpix/tools.js";
import { OpenModal } from "./knitpix/open-modal.js";

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

class SaveAs {
  constructor(getData) {
    document.getElementById("save-btn").onclick = this.save.bind(this);
    this.getData = getData;
  }

  save() {
    var fileContent = JSON.stringify(this.getData());
    var bb = new Blob([fileContent ], { type: 'application/json' });
    var a = document.createElement('a');
    a.download = 'design.knitpix';
    a.href = window.URL.createObjectURL(bb);
    a.click();
    a.remove();
  }
}

const storage = new Storage();
new Export();
let onSave = (data) => {
  storage.save(data);
};

const swatch = new Swatch((data) => {
  onSave(data);
}, storage.load());

const palette = new Palette(Colour.rgbaToPalette(swatch.data), (hex) => {
  swatch.currentColor = Colour.fromHex(hex);
}, (from, to) => {
  swatch.swapColor(Colour.fromHex(from), Colour.fromHex(to));
  onSave(swatch.data);
});


new SaveAs(() => swatch.data);

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

new OpenModal((inData) => {
  const data = JSON.parse(inData);
  swatch.rowCount = data.length;
  swatch.stitchCount = data.length > 0 ? data[0].length : 0;
  swatch.data = data;
  swatch.draw();
  const newPalette = Colour.rgbaToPalette(swatch.data);
  palette.colours = newPalette;
  palette.renderColours();
});

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

