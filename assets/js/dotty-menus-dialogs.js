
import { ArtMaths } from './dotty-canvas.js';

export class Menus {
	menus = document.querySelectorAll('ul[role="menubar"] > li[role="menuitem"]');

	constructor() {
		this.menus.forEach(e => {
			e.onclick = this.open.bind(this);
			e.onkeydown = (k) => {
				if (k.key === 'enter' || key === 'space') {
					this.open(k);
				}
			}
		});
	}

	closeOpen() {
		const currentlyOpen = document.querySelector("[role='menuitem'][aria-expanded='true']");
		if (!!currentlyOpen) {
			currentlyOpen.querySelector("[role='menu']").style.display = 'none';
			currentlyOpen.setAttribute('aria-expanded', false);
			currentlyOpen.onclick = this.open.bind(this);
		}
	}

	open(e) {
		this.closeOpen();
		var target = e.target;
		var menu = e.target.querySelector("[role='menu']");
		while (menu === null) {
			target = target.parentElement;
			menu = target.querySelector("[role='menu']");
		}
		menu.style.display = 'flex';
		target.setAttribute('aria-expanded', true);
		e.preventDefault();
		e.stopPropagation();
		target.onclick = this.close.bind(this);
		document.onclick = this.close.bind(this);
	}

	close(e) {
		this.closeOpen();
		document.onclick = undefined;
		if (!e.target instanceof HTMLInputElement) {
			e.preventDefault();
		}
	}
}

class Dialog {

	constructor(title, canvas, history, document) {
		this.title = title;
		this.canvas = canvas;
		this.history = history;
		this.document = document;
	}

	setup() {
		this.menu.onclick = this.open.bind(this);
		this.cancelBtn.onclick = this.cancel.bind(this);
		this.confirmBtn.onclick = this.confirm.bind(this);
	}

	open() {
		this.modal.style.display = "flex";
		this.title.hide()
	}

	cancel() {
		this.modal.style.display = "none";
		this.title.show();
	}

	confirm() {
		throw new Error("Not implemented!");
	}
}

export class ResizeDialog extends Dialog {
	cancelBtn = document.getElementById("resize-cancel");
	confirmBtn = document.getElementById("resize-confirm");
	width = document.getElementById("resize-width");
	height = document.getElementById("resize-height");
	modes = Array.from(document.querySelectorAll("input[type='radio'][name='resize']"));

	menu = document.getElementById("resize-menu");
	modal = document.getElementById("modal-wrapper-resize");

	constructor(title, canvas, history, document) {
		super(title, canvas, history, document)
		this.setup()
	}

	open() {
		super.open()
		this.width.value = this.document.width;
		this.height.value = this.document.height;
	}

	confirm() {
		this.cancel();
		this.history.clear();

		const resizeMode = this.find(input => input.checked).value;
		const newWidth = this.width.value;
		const newHeight = this.height.value;
		let newX, newY
		if (resizeMode === "top-left") {
			newX = 0, newY = 0;
		} else if (resizeMode == "top-right") {
			newY = 0;
			newX = newWidth - this.document.width;
		} else if (resizeMode == "bottom-left") {
			newY = newHeight - this.document.height;
			newX = 0;
		} else if (resizeMode == "bottom-right") {
			newY = newHeight - this.document.height;
			newX = newWidth - this.document.width;
		} else if (resizeMode == "center-center") {
			newY = Math.round((newHeight - this.document.height) / 2);
			newX = Math.round((newWidth - this.document.width) / 2);
		}
		const data = this.canvas.getData(0, 0, this.document.width, this.document.height);

		this.document.resize(newHeight, newWidth);
		this.canvas.resize(newHeight, newWidth);
		this.canvas.zoomReset();
		this.canvas.matchZoom();
		this.canvas.putData(data, newX, newY);
		this.canvas.save();
	}
}

export class NewDialog extends Dialog {
	preset = document.getElementById("new-preset");
	width = document.getElementById("new-width");
	height = document.getElementById("new-height");
	cancelBtn = document.getElementById("new-cancel");
	confirmBtn = document.getElementById("new-create");
	menu = document.getElementById("new");
	modal = document.getElementById("modal-wrapper-new");
	name = document.getElementById("new-name");

	constructor(title, canvas, history, document) {
		super(title, canvas, history, document);
		this.setup();
		this.preset.onchange = this.presetChange.bind(this);
	}

	presetChange(e) {
		const size = e.target.value;
		this.width.value = size;
		this.height.value = size;
	}

	confirm() {
		this.cancel();
		this.history.clear();

		this.document.rename(this.name.value);
		this.canvas.clear();
		const newHeight = this.height.value;
		const newWidth = this.width.value;
		this.document.resize(newHeight, newWidth);
		this.canvas.resize(newHeight, newWidth);
		this.canvas.zoomReset();
		this.canvas.matchZoom();
		this.canvas.save();
	}
}

export class ExportDialog extends Dialog {
	menu = document.getElementById("export-menu");
	modal = document.getElementById("modal-wrapper-export");
	size = document.getElementById("export-size");
	cancelBtn = document.getElementById("export-cancel");
	confirmBtn = document.getElementById("export-confirm");

	constructor(title, canvas, history, document) {
		super(title, canvas, history, document);
		this.setup();
	}

	confirm() {
		this.cancel();
		const requestedSize = Number.parseInt(document.querySelector(".export-size-grid input:checked").value);
		const exportCanvas = document.createElement('canvas');
		const width = this.document.width;
		const height = this.document.height;
		const filename = this.document.filename;
		const exportZoom = Math.ceil(requestedSize / width);
		exportCanvas.width = exportZoom * width;
		exportCanvas.height = exportZoom * height;
		const blobURL = this.canvas.toDataURL();

		const img = new Image();
		img.src = blobURL;

		img.onload = function () {
			URL.revokeObjectURL(this.src);
			document.body.appendChild(exportCanvas);
			const exportCtx = exportCanvas.getContext('2d');
			exportCtx.imageSmoothingEnabled = false;
			exportCtx.beginPath();
			exportCtx.drawImage(img, 0, 0, exportZoom * width, exportZoom * height);
			exportCtx.closePath();

			const uri = exportCanvas.toDataURL();
			document.body.removeChild(exportCanvas);

			var link = document.createElement('a');
			link.download = 'export-' + filename + '.png';
			link.href = uri;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		};
	}
}

export class OpenDialog extends Dialog {
	menu = document.getElementById("open-menu");
	modal = document.getElementById("modal-wrapper-open");
	importFile = document.getElementById("import-file");
	cancelBtn = document.getElementById("import-cancel");
	confirmBtn = document.getElementById("import-confirm");
	preview = document.getElementById("import-preview");
	errorMsg = document.getElementById("import-error");
	file = null;

	constructor(title, canvas, history, document) {
		super(title, canvas, history, document);
		this.setup();

		this.importFile.onchange = this.change.bind(this);
		this.preview.onerror = this.error.bind(this);
		this.preview.onload = this.load.bind(this);
	}

	change(e) {
		this.confirmBtn.disabled = true;
		this.errorMsg.textContent = '';
		this.file = e.target.files[0]; // get the file
		this.document.rename(this.file.name);
		const blobURL = URL.createObjectURL(this.file);
		this.preview.src = blobURL;
	}

	error() {
		URL.revokeObjectURL(this.preview.src);
		const err = `Cannot load image ${file.name}`;
		console.error(err);
		this.errorMsg.textContent = err;
	}

	load() {
		if (this.preview.naturalWidth > 256 || this.preview.naturalHeight > 256) {
			const err = "Sorry, this image is too large. Files should be no larger than 256x256 pixels"
			console.warn(err);
			this.errorMsg.textContent = err;
			return;
		}
		this.confirmBtn.disabled = false;
	}

	confirm() {
		this.cancel();
		this.document.resize(this.preview.naturalHeight, this.preview.naturalWidth);
		this.history.clear();
		this.canvas.resize(this.preview.naturalHeight, this.preview.naturalWidth);
		this.canvas.drawImage(this.preview, 0, 0, this.preview.naturalWidth, this.preview.naturalHeight);
		this.canvas.zoomReset();
		this.canvas.matchZoom();
		URL.revokeObjectURL(this.preview.src);
	}
}

export class ImportPaletteDialog extends Dialog {
	menu = document.getElementById("import-palette-menu");
	modal = document.getElementById("modal-wrapper-palette");
	importFile = document.getElementById("import-palette-file");
	cancelBtn = document.getElementById("import-palette-cancel");
	confirmBtn = document.getElementById("import-palette-confirm");
	chipTemplate = document.getElementById("color-palette-chip");
	chipDisplay = document.getElementById("palette-import-chip-list");
	errorMsg = document.getElementById("palette-error");
	img = new Image();
	file = null;
	colors = [];

	constructor(title, canvas, history, document, palette) {
		super(title, canvas, history, document);
		this.palette = palette;
		this.setup();
		this.importFile.onchange = this.change.bind(this);
		this.img.onload = this.load.bind(this);
		this.img.onerror = this.error.bind(this);
	}

	change(e) {
		this.errorMsg.textContent = '';
		this.chipDisplay.textContent = '';
		this.file = e.target.files[0]; // get the file
		const blobURL = URL.createObjectURL(this.file);
		this.img.src = blobURL;
	}

	load() {
		URL.revokeObjectURL(this.img.src);
		const importCanvas = document.createElement('canvas');
		importCanvas.width = this.img.width;
		importCanvas.height = this.img.height;
		const ctx = importCanvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		ctx.beginPath();
		ctx.drawImage(this.img, 0, 0);
		ctx.closePath();

		const colors = new Set();
		for (let x = 0; x < this.img.width; x++) {
			for (let y = 0; y < this.img.height; y++) {
				const color = ArtMaths.pixelToColor(ctx.getImageData(x, y, 1, 1).data);
				colors.add(color);

				if (colors.size > 256) {
					const err = "There's more than 256 colours in this palette. Sorry, we don't support that many.";
					console.warn(err);
					this.errorMsg.textContent = err;
					return;
				}
			}
		}

		this.colors = Array.from(colors).sort();
		this.showColors();
	}

	error() {
		URL.revokeObjectURL(this.img.src);
		const err = `Cannot load image ${this.file.name}`;
		console.error(err);
		this.errorMsg.textContent = err;
	}

	showColors() {
		for (const color of this.colors) {
			const clone = this.chipTemplate.content.cloneNode(true);
			let chip = clone.querySelector(".color-chip");
			chip.textContent = color;
			chip.style.color = color;
			chip.style.backgroundColor = color;
			this.chipDisplay.appendChild(chip);
		}
	}

	confirm() {
		this.cancel();
		this.palette.history = this.colors;
		this.palette.updateChips();
	}

}

export class AboutDialog {
	menu = document.getElementById("about");
	modal = document.getElementById("modal-wrapper-about");

	constructor(title) {
		this.title = title;

		this.menu.onclick = this.open.bind(this);
		this.modal.onclick = this.close.bind(this);
	}

	open() {
		this.modal.style.display = "flex";
		this.title.hide();
	}

	close() {
		this.modal.style.display = "none";
		this.title.show()
	}
}

export class DownloadMenu {
	menu = document.getElementById("download");

	constructor(canvas, document) {
		this.canvas = canvas;
		this.document = document;

		this.menu.onclick = this.download.bind(this);
	}

	download() {
		const uri = this.canvas.toDataURL();
		var link = document.createElement('a');
		link.download = this.document.filename;
		link.href = uri;
		document.body.appendChild(link);
		window.setTimeout(() => {
			link.click();
			document.body.removeChild(link);
		}, 1);
	}
}
