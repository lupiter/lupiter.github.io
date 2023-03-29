export class ArtMaths {
	static pixelToColor(imageData) {
		const pixel = new DataView(imageData.buffer);
		const pixelToHex = (idx) => ('00' + (pixel.getUint8(idx).toString(16))).slice(-2);
		return "#" + pixelToHex(0) + pixelToHex(1) + pixelToHex(2) + pixelToHex(3);
	}

	static colorToPixel(color) {
		const red = Number.parseInt(color.slice(1, 3), 16);
		const green = Number.parseInt(color.slice(3, 5), 16);
		const blue = Number.parseInt(color.slice(5, 7), 16);
		const alpha = Number.parseInt(color.slice(7), 16);
		return {
			r: red,
			g: green,
			b: blue,
			a: alpha
		}
	}
}

class Geometry {
	static midpoint(touches) {
		var totalX = 0, totalY = 0;
		for (let i = 0; i < touches.length; i++) {
			const touch = touches[i];
			totalX += touch.screenX;
			totalY += touch.screenY;
		}
		return {
			x: totalX / touches.length,
			y: totalY / touches.length,
		};
	}

	static distance(touches) {
		// we'll assume 2 touches
		let [t1, t2] = touches;
		let x = Math.abs(t1.screenX - t2.screenX);
		let y = Math.abs(t1.screenY - t2.screenY);
		return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	}

	static panAndSpread(initial, last) {
		// pan
		const startMove = Geometry.midpoint(initial);
		const endMove = Geometry.midpoint(last);
		const pan = {
			x: endMove.x - startMove.x,
			y: endMove.y - startMove.y
		};

		// spread
		const startSpread = Geometry.distance(initialTouch);
		const endSpread = Geometry.distance(lastTouch);
		const goalSpread = endSpread - startSpread;
		const spread = (goalSpread / 100 + 1);

		return { pan, spread };
	}
}

export class Canvas {
	mouseDown = false;
	moveOrigin = undefined;
	initialTouch = undefined;
	lastTouch = undefined;
	canvas = document.getElementById("canvas");
	wrapper = document.getElementById("canvas-wrapper");
	inner = document.getElementById("inner-canvas");
	win = document.getElementById("win");
	clearMenu = document.getElementById("clear-menu");

	zoomInButton = document.getElementById("zoom-in");
	zoomInMenu = document.getElementById("zoom-in-menu");
	zoomOutButton = document.getElementById("zoom-out");
	zoomOutMenu = document.getElementById("zoom-out-menu");
	zoomResetButton = document.getElementById("zoom-reset");
	zoomResetMenu = document.getElementById("zoom-fit-menu");
	zoom = 1;
	translate = { 'x': 0, 'y': 0 };
	moving = false;

	constructor(document, tools, palette, history) {
		this.ctx = this.canvas.getContext('2d');
		this.tools = tools;
		this.palette = palette;
		this.document = document;
		this.history = history;

		this.canvas.onmousedown = this.onStart.bind(this);
		this.canvas.ontouchstart = this.onStart.bind(this);
		this.canvas.onmouseup = this.onStop.bind(this);
		this.canvas.ontouchend = this.onStop.bind(this);

		this.clearMenu.onclick = this.clear.bind(this);
		this.zoomInButton.onclick = this.zoomIn.bind(this);
		this.zoomInMenu.onclick = this.zoomIn.bind(this);
		this.zoomOutButton.onclick = this.zoomOut.bind(this);
		this.zoomOutMenu.onclick = this.zoomOut.bind(this);
		this.zoomResetButton.onclick = this.zoomReset.bind(this);
		this.zoomResetMenu.onclick = this.zoomReset.bind(this);

		window.document.body.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
		canvas.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
		canvas.onmousemove = this.onMove.bind(this);

		this.zoomReset();
	}

	onMove(e) {
		e.preventDefault();
		if (!this.mouseDown) {
			return;
		}
		this._paint(e);
	}

	toDataURL() {
		return this.canvas.toDataURL();
	}

	getData(x, y, width, height) {
		return this.ctx.getImageData(x, y, width, height);
	}

	setData(data, x, y) {
		return this.ctx.putImageData(data, x, y);
	}

	drawImage(img, x, y, width, height) {
		this.ctx.beginPath();
		this.ctx.drawImage(img, x, y, width, height);
		this.ctx.closePath();
	}

	save() {
		this.palette.save();
		this.history.save();
		localStorage.setItem('canvas', this.canvas.toDataURL());
		localStorage.setItem('document', JSON.stringify(this.document));
	}

	load() {
		this.palette.load();
		this.history.load();
		let saveDocument = localStorage.getItem('document');
		if (!!saveDocument && saveDocument.length > 0) {
			let data = JSON.parse(saveDocument);
			this.document.resize(data.height, data.width);
			this.document.rename(data.filename);
			this.resize(data.width, data.height);
			this.zoomReset();
		}
		let saveData = localStorage.getItem('canvas');
		if (!!saveData && saveData.length > 0) {
			this.paint(saveData);
		}
	}

	resize(width, height) {
		this.canvas.width = width;
		this.canvas.height = height;
		this.win.height = height;
		this.win.width = width;
	}

	matchZoom() {
		this.canvas.style.height = Math.floor(this.document.height * this.zoom) + "px";
		this.canvas.style.width = Math.floor(this.document.width * this.zoom) + "px";
		this.canvas.style.backgroundSize = (this.zoom * 2) + "px";
		this.inner.style.width = Math.floor(this.document.width * this.zoom) + "px";
		this.inner.style.height = Math.floor(this.document.height * this.zoom) + "px";
	}

	zoomReset() {
		if (this.wrapper.offsetWidth < this.wrapper.offsetHeight) {
			this.zoom = Math.floor(this.wrapper.offsetWidth / this.document.width);
		} else {
			this.zoom = Math.floor(this.wrapper.offsetHeight / this.document.height);
		}
		this.canvas.style.translate = '';
		this.translate = { 'x': 0, 'y': 0};
		this.matchZoom();
	}

	zoomIn() {
		this.zoom += 3;
		this.matchZoom();
	}

	zoomOut() {
		this.zoom -= 3;
		this.matchZoom();
	}

	paint(blobURL, x = 0, y = 0) {
		const img = new Image();
		img.src = blobURL;
		const ctx = this.ctx;
		const width = this.document.width;
		const height = this.document.height;

		img.onload = function () {
			URL.revokeObjectURL(this.src);
			ctx.beginPath();
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(img, x, y, width, height);
			ctx.closePath();
		};
	}

	clear() {
		this.history.add();
		this.ctx.beginPath();
		this.ctx.clearRect(0, 0, this.document.width, this.document.height);
		this.ctx.closePath();
		this.save();
	}

	get scale() {
		return Number.parseInt(this.canvas.style.scale);
	}

	onStop(e) {
		this.mouseDown = false;
		if (!!this.initialTouch && !!this.lastTouch) {
			const { pan, spread } = calcPanAndSpread();
			console.log(pan, spread, this.canvas.style.translate, this.canvas.style.scale);
			this.zoom = this.zoom * spread;
			this.matchZoom();
			this.canvas.style.scale = "";

			this.canvas.style.translate = "";
			this.wrapper.scrollTop = this.wrapper.scrollTop - pan.y;
			this.wrapper.scrollLeft = this.wrapper.scrollLeft - pan.x;

			this.lastTouch = undefined;
			this.initialTouch = undefined;
			return;
		}
		if (this.tools.isDropper()) {
			const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / this.zoom);
			const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / this.zoom);
			this.palette.setColor(ArtMaths.pixelToColor(this.ctx.getImageData(x, y, 1, 1).data));
			this.palette.addToHistory();
		} else if (this.tools.isMove()) {
			const data = this.canvas.toDataURL();
			this.paint(data, this.translate.x / this.zoom, this.translate.y / this.zoom);
			this.canvas.style.translate = "";
			this.moveOrigin = undefined;
		}
		this.save();
	}

	onStart(e) {
		this.history.add();
		if (e.touches && e.touches.length === 2) {
			this.initialTouch = e.touches;
		}
		if (this.tools.isMove()) {
			const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / this.zoom);
			const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / this.zoom);
			this.moveOrigin = { x, y };
			this.startMoving();
		}
		this.mouseDown = true;
		this._paint(e);
	}

	startMoving() {
		this.moving = this.canvas.cloneNode();
		const ctx = this.moving.getContext('2d');
		ctx.beginPath();
		ctx.drawImage(this.canvas, 0, 0);
		ctx.closePath();
		this.moving.id = "canvas-clone-moving";
		this.canvas.parentNode.append(this.moving);

		this.moving.onmousedown = this.resumeMoving.bind(this);
		this.moving.ontouchstart = this.resumeMoving.bind(this);
		this.moving.onmouseup = this.pauseMoving.bind(this);
		this.moving.ontouchend = this.pauseMoving.bind(this);

		this.moving.addEventListener('touchmove', this.continueMoving.bind(this), { passive: false });
		this.moving.onmousemove = this.continueMoving.bind(this);
	}

	stopMoving(e) {
		const data = this.canvas.toDataURL();
		this.paint(data, this.translate.x / this.zoom, this.translate.y / this.zoom);
		this.canvas.style.translate = "";
		this.moveOrigin = undefined;
		this.moving.remove();
		this.moving = undefined;
		this.onStart(e);
	}

	resumeMoving(e) {
		this.mouseDown = true;
		if (!this.tools.isMove()) {
			this.stopMoving(e);
		}
	}

	pauseMoving(e) {
		this.mouseDown = false;
	}

	continueMoving(e) {
		if (!this.mouseDown) {
			return;
		}
		if (!this.tools.isMove()) {
			this.stopMoving(e);
		}
		this._paint(e);
	}

	_paint(e) {
		// check if we're panning or zooming with two fingers
		if (e.touches && e.touches.length > 1) {
			// it's multitouch! oh no!
			if (e.touches.length > 2) {
				// sorry, don't know what to do with that many touches
				return;
			}
			if (!this.initialTouch) {
				this.initialTouch = e.touches;
				return;
			}
			this.lastTouch = e.touches;
			const { pan, spread } = Geometry.panAndSpread(this.initialTouch, this.lastTouch);
			this.canvas.style.translate = pan.x + "px " + pan.y + "px";
			this.canvas.style.scale = "" + spread;
			return;
		}

		// okay, continue painting
		const zoom = this.zoom;
		const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
		const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
		const fillStyle = this.palette.current;
		// console.log(drawMode, fillStyle);
		this.ctx.beginPath();
		if (this.tools.isPen()) {
			this.ctx.fillStyle = fillStyle;
			this.ctx.fillRect(x, y, 1, 1);
		} else if (this.tools.isEraser()) {
			this.ctx.clearRect(x, y, 1, 1);
		} else if (this.tools.isPencil()) {
			let remainX = (e.offsetX / zoom) - x;
			let remainY = (e.offsetY / zoom) - y;
			if (remainX > 0.2 && remainY > 0.2 && remainX < 0.8 && remainY < 0.8) {
				this.ctx.fillStyle = fillStyle;
				this.ctx.fillRect(x, y, 1, 1);
			}
		} else if (this.tools.isBucket()) {
			this.floodFill(x, y);
		} else if (this.tools.isMove()) {
			if (this.translate.x != 0 || this.translate.y != 0) {
				const expected = {'x': Math.floor((x - this.moveOrigin.x) * zoom + this.translate.x), 'y': Math.floor((y - this.moveOrigin.y) * zoom + this.translate.y)};
				if (expected.x != this.translate.x || expected.y != this.translate.y) {
					this.moving.style.translate = `${expected.x}px ${expected.y}px`;
					this.translate = expected;
				}
			} else {
				this.translate = { 'x' : Math.floor((x - this.moveOrigin.x) * zoom), 'y' : Math.floor((y - this.moveOrigin.y) * zoom)};
				this.moving.style.translate =  `${this.translate.x}px ${this.translate.y}px`;
			}
		} else {
			// console.warn("Unexpected tool", this.tools.current);
		}
		this.ctx.closePath();
	}

	floodFill(startX, startY) {
		// Credit: Tom Cantwell https://cantwell-tom.medium.com/flood-fill-and-line-tool-for-html-canvas-65e08e31aec6
		let imageData = this.ctx.getImageData(0, 0, this.document.height, this.document.width);

		let start = (startY * this.document.width + startX) * 4;
		let pixel = imageData.data.slice(start, start + 16);
		// exit if color is the same
		let color = ArtMaths.pixelToColor(pixel);
		let newColor = ArtMaths.colorToPixel(this.palette.current);
		if (this.palette.current === color) {
			return;
		}

		const matchStartColor = (pixelPos) => {
			let col = ArtMaths.pixelToColor(imageData.data.slice(pixelPos, pixelPos + 16));
			return col === color;
		}
		const colorPixel = (pixelPos) => {
			imageData.data[pixelPos] = newColor.r;
			imageData.data[pixelPos + 1] = newColor.g;
			imageData.data[pixelPos + 2] = newColor.b;
			imageData.data[pixelPos + 3] = newColor.a;
		}

		let pixelStack = [[startX, startY]];
		let width = this.document.width;
		let height = this.document.height;
		let newPos, x, y, pixelPos, reachLeft, reachRight;
		fill();
		function fill() {
			newPos = pixelStack.pop();
			x = newPos[0];
			y = newPos[1]; // get current pixel position
			pixelPos = (y * width + x) * 4;
			// Go up as long as the color matches and are inside the canvas
			while (y >= 0 && matchStartColor(pixelPos)) {
				y--;
				pixelPos -= width * 4;
			}
			// Don't overextend
			pixelPos += width * 4;
			y++;
			reachLeft = false;
			reachRight = false;
			// Go down as long as the color matches and in inside the canvas

			while (y < height && matchStartColor(pixelPos)) {
				colorPixel(pixelPos);
				if (x > 0) {
					if (matchStartColor(pixelPos - 4)) {
						if (!reachLeft) {
							//Add pixel to stack
							pixelStack.push([x - 1, y]);
							reachLeft = true;
						}
					} else if (reachLeft) {
						reachLeft = false;
					}
				} if (x < width - 1) {
					if (matchStartColor(pixelPos + 4)) {
						if (!reachRight) {
							// Add pixel to stack
							pixelStack.push([x + 1, y]);
							reachRight = true;
						}
					} else if (reachRight) {
						reachRight = false;
					}
				}
				y++;
				pixelPos += width * 4;
			}    // recursive until no more pixels to change
			if (pixelStack.length) {
				fill();
			}
		}

		// render floodFill result
		this.ctx.putImageData(imageData, 0, 0);
	}
}

export class History {
	constructor(canvas) {
		this.back = [];
		this.forward = [];
		this.canvas = canvas;

		this.undoButton = document.getElementById("undo-btn");
		this.redoButton = document.getElementById("redo-btn");
		this.undoMenu = document.getElementById("undo-menu");
		this.redoMenu = document.getElementById("redo-menu");

		this.undoButton.onclick = this.undo.bind(this);
		this.undoMenu.onclick = this.undo.bind(this);
		this.redoButton.onclick = this.redo.bind(this);
		this.redoMenu.onclick = this.redo.bind(this);
	}

	updateButtons() {
		const backDisabled = this.back.length === 0;
		const forwardDisabled = this.forward.length === 0;
		this.undoButton.disabled = backDisabled;
		this.redoButton.disabled = forwardDisabled;
		this.undoMenu.ariaDisabled = backDisabled;
		if (backDisabled) {
			this.undoMenu.classList.add("disabled")
		} else {
			this.undoMenu.classList.remove("disabled")
		}
		this.redoMenu.ariaDisabled = forwardDisabled;
		if (forwardDisabled) {
			this.redoMenu.classList.add("disabled")
		} else {
			this.redoMenu.classList.remove("disabled")
		}
	}

	add() {
		this.back.push(this.canvas.toDataURL());
		this.forward = [];
		this.updateButtons();
	}

	undo() {
		var data = this.back.pop();
		this.canvas.paint(data);
		this.forward.push(canvas.toDataURL());
		this.updateButtons();
	}

	redo() {
		var data = this.forward.pop();
		this.canvas.paint(data);
		this.back.push(canvas.toDataURL());
		this.updateButtons();
	}

	clear() {
		this.back = [];
		this.forward = [];
		this.updateButtons();
	}

	save() {
		localStorage.setItem('undo', JSON.stringify(this.back));
	}

	load() {
		let editHistory = JSON.parse(localStorage.getItem('undo'));
		if (!!editHistory && editHistory.length > 0) {
			this.back = editHistory;
		}
	}
}

