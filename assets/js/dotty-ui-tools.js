export class Palette {
	colorInput = document.getElementById("color");
	alphaInput = document.getElementById("alpha");
	historyView = document.getElementById("color-history");
	chipTemplate = document.getElementById("color-chip");

	constructor() {
		this.history = [];

		this.colorInput.onchange = this.readColor.bind(this);
		this.alphaInput.onchange = this.readColor.bind(this);
		this.load();
		if (this.history.length) {
			const color = this.history[this.history.length - 1];
			this.current = color;
			this.colorInput.value = this.current.slice(0, 7);
			this.alphaInput.value = Math.round((Number.parseInt(this.current.slice(7), 16) / 255) * 100);
		} else {
			this.readColor();
		}
	}

	readColor() {
		this.current = this.colorInput.value + Math.floor(((this.alphaInput.value / 100) * 255)).toString(16);
		this.addToHistory();
	}

	addToHistory() {
		if (this.history.includes(this.current)) {
			this.history = this.history.filter(x => x !== this.current);
		}
		this.history.push(this.current);
		this.updateChips();
		this.save();
	}

	updateChips() {
		this.historyView.textContent = "";
		for (const color of [...this.history].reverse()) {
			const clone = this.chipTemplate.content.cloneNode(true);
			let button = clone.querySelector("button");
			button.textContent = color;
			button.style.color = color;
			button.style.backgroundColor = color;
			button.onclick = () => this.setColor(color);
			this.historyView.appendChild(button);
		}
	}

	setColor(color) {
		this.current = color;
		this.colorInput.value = this.current.slice(0, 7);
		this.alphaInput.value = Math.round((Number.parseInt(this.current.slice(7), 16) / 255) * 100);
		this.addToHistory();
	}

	save() {
		localStorage.setItem('colors', JSON.stringify(this.history));
	}

	load() {
		let colors = JSON.parse(localStorage.getItem('colors'));
		if (!!colors && colors.length > 0) {
			this.history = colors;
			this.updateChips();
		}
	}
}

export class Tools {
	pen = document.getElementById("pen");
	pencil = document.getElementById("pencil");
	eraser = document.getElementById("eraser");
	dropper = document.getElementById("dropper");
	bucket = document.getElementById("bucket");
	move = document.getElementById("move");

	constructor() {
		this.current = this.pen.value;

		this.read();
		this.pen.onchange = this.read.bind(this);
		this.eraser.onchange = this.read.bind(this);
		this.pencil.onchange = this.read.bind(this);
		this.dropper.onchange = this.read.bind(this);
		this.bucket.onchange = this.read.bind(this);
		this.move.onchange = this.read.bind(this);
	}

	read() {
		this.current = [this.pen, this.eraser, this.pencil, this.dropper, this.bucket, this.move].find((tool) => tool.checked).value;
	}

	isPen() {
		return this.current === this.pen.value;
	}

	isEraser() {
		return this.current === this.eraser.value;
	}

	isPencil() {
		return this.current === this.pencil.value;
	}

	isDropper() {
		return this.current === this.dropper.value;
	}

	isBucket() {
		return this.current === this.bucket.value;
	}

	isMove() {
		return this.current === this.move.value;
	}
}

export class Document {
	height = 16;
	width = 16;
	uiSize = document.getElementById("size");
	filename = "My Cool Art";
	uiName = document.getElementById("name");

	constructor() {
		this.resize(this.height, this.width);
		this.rename(this.filename);
	}

	rename(newName) {
		this.filename = newName;
		this.uiName.textContent = newName;
	}

	resize(newHeight, newWidth) {
		this.height = newHeight;
		this.width = newWidth;
		this.uiSize.textContent = "" + this.height + "x" + this.width;
	}
}

export class Title {
	title = document.getElementById("main-title");

	hide() {
		this.title.className = "inactive-title-bar";
	}

	show() {
		this.title.className = "title-bar";
	}
}