class Color {
	r = 0;
	g = 0;
	b = 0;

	static fromHex(hex) {
		const bigint = parseInt(hex.slice(1), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return new Color(r,g,b);
	}

	constructor(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
	}

	static roundTo(component, possibilities) {
		for (let i = 0; i < possibilities.length; i++) {
			const current = possibilities[i];
			if (i === possibilities.length - 1) {
				return current;
			}
			const next = possibilities[i+1];
			if (Math.abs(current - component) < Math.abs(next - component)) {
				return current;
			}
		}
	}

	static roundToWeb(component) {
		if (component < 0x33 - component) {
			return 0;
		} else if (0x33 - component < 0x66 - component) {
			return 0x33;
		} else if (0x66 - component < 0x99 - component) {
			return 0x66;
		} else if (0x99 - component < 0xCC - component) {
			return 0x99;
		} else if (0xCC - component < 0xFF - component) {
			return 0xCC;
		} else {
			return 0xFF;
		}
	}

	static toHex(d) {
		return Number(d).toString(16).padStart(2, '0');
	}

	cga() {
		const cgaFragments = [0x00, 0x55, 0xAA, 0xFF];
		const r = Color.roundTo(this.r, cgaFragments);
		let greenOptions;
		if (r === 0x00) {
			greenOptions = [0x00, 0xAA];
		} else if (r === 0x55) {
			greenOptions = [0x55, 0xFF];
		} else if (r === 0xAA) {
			greenOptions = [0x00, 0x55, 0xAA];
		} else {
			greenOptions = [0x55, 0xFF];
		}
		const g = Color.roundTo(this.g, greenOptions);
		let blueOptions;
		if (r === 0x00) {
			blueOptions = [0x00, 0xAA];
		} else if (r === 0x55) {
			blueOptions = [0x55, 0xFF];
		} else if (r === 0xAA) {
			if (g === 0x00) {
				blueOptions = [0x00, 0xAA];
			} else if (g === 0x55) {
				return new Color(r, g, 0x00);
			} else {
				return new Color(r, g, 0xAA);
			}
		} else {
			blueOptions = [0x55, 0xFF];
		}
		const b = Color.roundTo(this.b, blueOptions);
		return new Color(r,g,b);
	}

	web() {
		const webFragments = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];
		let r = Color.roundTo(this.r, webFragments);
		let g = Color.roundTo(this.g, webFragments);
		let b = Color.roundTo(this.b, webFragments);
		return new Color(r,g,b);
	}

	gbc() {
		let r = Math.round(this.r / 5) * 5;
		let g = Math.round(this.g / 5) * 5;
		let b = Math.round(this.b / 5) * 5;
		return new Color(r,g,b);
	}

	hex() {
		return '#' + Color.toHex(this.r) + Color.toHex(this.g) + Color.toHex(this.b);
	}
}

export class Palette {
	colorInput = document.getElementById("color");
	alphaInput = document.getElementById("alpha");
	historyView = document.getElementById("color-history");
	chipTemplate = document.getElementById("color-chip");
	lockInput = document.getElementById("palette-lock");
	modes = Array.from(document.querySelectorAll("input[type='radio'][name='palette-bit-mode']"));

	mode = 'full';
	locked = false;

	constructor() {
		this.history = [];

		this.colorInput.onchange = this.readColor.bind(this);
		this.alphaInput.onchange = this.readColor.bind(this);
		this.lockInput.onchange = this.lock.bind(this);
		const that = this;
		this.modes.forEach(mode => {
			mode.onchange = that.modechange.bind(that);
		});
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

	lock() {
		this.locked = this.lockInput.checked;
		this.save();
	}

	modechange() {
		this.mode = this.modes.find(m => m.checked).value;
		this.history = this.history.map(c => this.clamp(c));
		this.current = this.clamp(this.current);
		this.updateChips();
		this.updateDisplay();
	}


	clamp(raw) {
		const color = Color.fromHex(raw.slice(0, 7));
		switch(this.mode) {
			case 'full':
				return raw;
			case 'cga':
				return color.cga().hex() + "FF"
			case 'web':
				return color.web().hex() + "FF"
			case 'gbc':
				return color.gbc().hex() + "FF"
		}
	}

	readColor() {
		if (this.locked) {
			this.updateDisplay();
			return;
		}
		const color = this.colorInput.value + Math.floor(((this.alphaInput.value / 100) * 255)).toString(16);
		this.current = this.clamp(color);
		this.addToHistory();
		this.updateDisplay();
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
		if (this.locked && !this.history.includes(color)) {
			return;
		}
		this.current = this.clamp(color);
		this.updateDisplay();
		this.addToHistory();
	}

	updateDisplay() {
		this.colorInput.value = this.current.slice(0, 7);
		this.alphaInput.value = Math.round((Number.parseInt(this.current.slice(7), 16) / 255) * 100);
	}

	save() {
		localStorage.setItem('colors', JSON.stringify(this.history));
		localStorage.setItem('palette-locked', this.locked);
	}

	load() {
		let colors = JSON.parse(localStorage.getItem('colors'));
		if (!!colors && colors.length > 0) {
			this.history = colors;
			this.updateChips();
		}
		this.locked = localStorage.getItem('palette-locked');
		this.lockInput.checked = this.locked === 'true';
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