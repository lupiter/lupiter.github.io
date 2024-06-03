
export class History {
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