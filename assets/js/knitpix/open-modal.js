import { Modal } from "./modal.js";

export class OpenModal extends Modal {
  constructor(onOpen) {
    super("open-btn", "open-dlg-confirm", "open-dlg");
    this.input = document.getElementById("open-dlg-input");
    this.onOpen = onOpen;
    this.dialog.onclose = this.dialogClosed.bind(this);
    this.input.onchange = this.fileChanged.bind(this);
  }

  dialogClosed(e) {
    if (this.dialog.returnValue === "cancel") {
      // canceled, ignore
      return;
    }
    this.onOpen(this.confirmButton.value);
  }

  fileChanged(e) {
    if (this.input.files.length > 0) { 
      const contents = this.input.files[0].text();
      try {
        JSON.parse(contents);
        this.confirmButton.value = contents;
      } catch (e) {
        console.error(e);
      }
    }
  }
}