let canvas = document.getElementById("canvas");
let canvasWrapper = document.getElementById("canvas-wrapper");
let ctx = canvas.getContext('2d');
let output = document.getElementById("download");
let input = document.getElementById("file");

let newDocument = document.getElementById("new");
let modalNew = document.getElementById("modal-wrapper-new");
let about = document.getElementById("about");
let modalAbout = document.getElementById("modal-wrapper-about");
let undoMenu = document.getElementById("undo-menu");
let redoMenu = document.getElementById("redo-menu");
let clearMenu = document.getElementById("clear-menu");
let resizeMenu = document.getElementById("resize-menu");
let resizeModal = document.getElementById("modal-wrapper-resize");

let mainTitle = document.getElementById("main-title");
let win = document.getElementById("win");
let colorInput = document.getElementById("color");
let alphaInput = document.getElementById("alpha");
let colorHistoryView = document.getElementById("color-history");
let colorChipTemplate = document.getElementById("color-chip");

let pen = document.getElementById("pen");
let pencil = document.getElementById("pencil");
let eraser = document.getElementById("eraser");
let dropper = document.getElementById("dropper");

let undoButton = document.getElementById("undo-btn");
let redoButton = document.getElementById("redo-btn");
let filename = "My Cool Art";
let currentColor = "#000000ff";
let colorHistory = [];

// Zoom

let zoom = 1;
let height = 16;
let width = 16;

const adjustZoom = function () {
    canvas.style.height = Math.floor(height * zoom) + "px";
    canvas.style.width = Math.floor(width * zoom) + "px";
}
let zoomIn = document.getElementById("zoom-in");
zoomIn.onclick = function () {
    zoom += 3;
    adjustZoom();
};
let zoomOut = document.getElementById("zoom-out");
zoomOut.onclick = function () {
    zoom -= 3;
    adjustZoom();
};
let zoomReset = document.getElementById("zoom-reset");
zoomReset.onclick = function () {
    if (canvasWrapper.offsetWidth  < canvasWrapper.offsetHeight ) {
        zoom = Math.floor(canvasWrapper.offsetWidth / width);
    } else {
        zoom = Math.floor(canvasWrapper.offsetHeight / height);
    }
    adjustZoom();
};
zoomReset.click();

// Undo History

let historyBack = [];
let historyForward = [];

const updateHistoryButtons = function () {
    const backDisabled = historyBack.length === 0;
    const forwardDisabled = historyForward.length === 0;
    undoButton.disabled = backDisabled;
    redoButton.disabled = forwardDisabled;
    undoMenu.ariaDisabled = backDisabled;
    if (backDisabled) {
        undoMenu.classList.add("disabled")
    } else {
        undoMenu.classList.remove("disabled")
    }
    redoMenu.ariaDisabled = forwardDisabled;
    if (forwardDisabled) {
        redoMenu.classList.add("disabled")
    } else {
        redoMenu.classList.remove("disabled")
    }
}

const addHistory = function () {
    historyBack.push(canvas.toDataURL());
    historyForward = [];
    updateHistoryButtons();
}

const paintHistory = function (blobURL) {
    const img = new Image();
    img.src = blobURL;

    img.onload = function () {
        URL.revokeObjectURL(this.src);
        ctx.beginPath();
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        ctx.closePath();
    };
}

const historyGoBack = function () {
    var data = historyBack.pop();
    paintHistory(data);
    historyForward.push(canvas.toDataURL());
    updateHistoryButtons();
}

const historyGoForward = function () {
    var data = historyForward.pop();
    paintHistory(data);
    historyBack.push(canvas.toDataURL());
    updateHistoryButtons();
}

const clearHistory = function () {
    historyBack = [];
    historyForward = [];
    updateHistoryButtons();
}

undoButton.onclick = historyGoBack;
undoMenu.onclick = historyGoBack;
redoButton.onclick = historyGoForward;
redoMenu.onclick = historyGoForward;

// Colors

const setColor = (color) => {
    currentColor = color;
    colorInput.value = currentColor.slice(0, 7);
    alphaInput.value = Math.round((Number.parseInt(currentColor.slice(7), 16) / 255) * 100);
}

const updateChips = function() {
    colorHistoryView.innerHTML = "";
    for (const color of [...colorHistory].reverse()) {
        const clone = colorChipTemplate.content.cloneNode(true);
        let button = clone.querySelector("button");
        button.textContent = color;
        button.style.color = color;
        button.style.backgroundColor = color;
        button.onclick = () => setColor(color);
        colorHistoryView.appendChild(button);
    }
}

const updateColor = function() {
    currentColor = colorInput.value + Math.floor(((alphaInput.value / 100) * 255)).toString(16);
    if (colorHistory.includes(currentColor)) {
        colorHistory = colorHistory.filter(x => x !== currentColor);
    }
    colorHistory.push(currentColor);
    autoSave();
    updateChips();
}

colorHistory.push(currentColor);
updateChips();
alphaInput.onchange = updateColor;
colorInput.onchange = updateColor;

// Save

const autoSave = function() {
    localStorage.setItem('canvas', canvas.toDataURL());
    localStorage.setItem('undo', JSON.stringify(historyBack));
    localStorage.setItem('colors', JSON.stringify(colorHistory));
}

const loadSave = function() {
    let saveData = localStorage.getItem('canvas');
    if (!!saveData && saveData.length > 0) {
        paintHistory(saveData);
    }
    editHistory = JSON.parse(localStorage.getItem('undo'));
    if (!!editHistory && editHistory.length > 0) {
        historyBack = editHistory;
    }
    colors = JSON.parse(localStorage.getItem('colors'));
    if (!!colors && colors.length > 0) {
        colorHistory = colors;
        updateChips();
    }
}
loadSave();

// Draw

var drawMode = pen.value;
const updateDrawMode = function() {
    drawMode = [pen, eraser, pencil, dropper].find((tool) => tool.checked).value;
}
updateDrawMode();
pen.onchange = updateDrawMode;
eraser.onchange = updateDrawMode;
pencil.onchange = updateDrawMode;
dropper.onchange = updateDrawMode;

let mouseDown = false;

const paint = function (e) {
    const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
    const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
    const fillStyle = currentColor;
    // console.log(drawMode, fillStyle);
    ctx.beginPath();
    if (drawMode === pen.value) {
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, 1, 1);
    } else if (drawMode == eraser.value) {
        ctx.clearRect(x, y, 1, 1);
    } else if (drawMode == pencil.value) {
        let remainX = (e.offsetX / zoom) - x;
        let remainY = (e.offsetY / zoom) - y;
        if (remainX > 0.2 && remainY > 0.2 && remainX < 0.8 && remainY < 0.8) {
            ctx.fillStyle = fillStyle;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    ctx.closePath();
}

const onStart = function (e) {
    addHistory();
    paint(e);
    mouseDown = true;
}

const onStop = function (e) {
    mouseDown = false;
    if (drawMode == dropper.value) {
        const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
        const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
        const pixel = new DataView(ctx.getImageData(x, y, 1, 1).data.buffer);
        const pixelToHex = (idx) => ('00'+(pixel.getUint8(idx).toString(16))).slice(-2);
        const color = "#" + pixelToHex(0) + pixelToHex(1) + pixelToHex(2) + pixelToHex(3);
        setColor(color);
    }
    autoSave();
}

canvas.onmousedown = onStart;
canvas.ontouchstart = onStart;
canvas.onmouseup = onStop;
canvas.ontouchend = onStop;

const onMove = function (e) {
    e.preventDefault();
    if (!mouseDown) {
        return;
    }
    paint(e);
}

document.body.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchmove', onMove, {passive: false });
canvas.onmousemove = onMove;
clearMenu.onclick = () => {
    addHistory();
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.closePath();
    autoSave();
};

// UI

const updateName = function(newName) {
    filename = newName;
    document.getElementById("name").textContent = filename;
}
updateName(filename);

const updateSize = function(newH, newW) {
    height = newH;
    width = newW;
    document.getElementById("size").textContent = "" + height + "x" + width;
}
updateSize(width, height);

// Canvas

const resizeCanvas = function() {
    canvas.width  = width;
    canvas.height = height;
    win.height = height;
    win.width = width;
}

let resizeCancel = document.getElementById("resize-cancel");
let resizeConfirm = document.getElementById("resize-confirm");
let resizeWidth = document.getElementById("resize-width");
let resizeHeight = document.getElementById("resize-height");
let resizeModes = Array.from(document.querySelectorAll("input[type='radio'][name='resize']"));
resizeMenu.onclick = function() {
    resizeWidth.value = width;
    resizeHeight.value = height;
    resizeModal.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}

resizeCancel.onclick = function() {
    resizeModal.style.display = "none";
    mainTitle.className = "title-bar";
}

resizeConfirm.onclick = function() {
    resizeCancel.click();
    historyBack = [];
    historyForward = [];

    const resizeMode = resizeModes.find(input => input.checked).value;
    const newWidth = resizeWidth.value;
    const newHeight = resizeHeight.value;
    let newX, newY
    if (resizeMode === "top-left") {
        newX = 0, newY = 0;
    } else if (resizeMode == "top-right") {
        newY = 0;
        newX = newWidth - width;
    } else if (resizeMode == "bottom-left") {
        newY = newHeight - height;
        newX = 0;
    } else if (resizeMode == "bottom-right") {
        newY = newHeight - height;
        newX = newWidth - width;
    } else if (resizeMode == "center-center") {
        newY = Math.round((newHeight - height) / 2);
        newX = Math.round((newWidth - width) / 2);
    }
    const data = ctx.getImageData(0, 0, width, height);

    updateSize(newHeight, newWidth);
    resizeCanvas();
    zoomReset.click();
    adjustZoom();
    ctx.putImageData(data, newX, newY);

    autoSave();
}

// New Dialog

let newPreset = document.getElementById("new-preset");
let newWidth = document.getElementById("new-width");
let newHeight = document.getElementById("new-height");
newPreset.onchange = function (e) {
    const size = e.target.value;
    newWidth.value = size;
    newHeight.value = size;
}
let newCancel = document.getElementById("new-cancel");
newCancel.onclick = function () {
    modalNew.style.display = "none";
    mainTitle.className = "title-bar";
}
let newCreate = document.getElementById("new-create");
newCreate.onclick = function () {
    modalNew.style.display = "none";
    mainTitle.className = "title-bar";
    updateName(document.getElementById("new-name").value);
    ctx.clearRect(0, 0, height, width);
    updateSize(document.getElementById("new-height").value, document.getElementById("new-width").value);
    resizeCanvas();
}

newDocument.onclick = function () {
    modalNew.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}

// About Dialog

about.onclick = function () {
    console.log("show about");
    modalAbout.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}

modalAbout.onclick = function () {
    modalAbout.style.display = "none";
    mainTitle.className = "title-bar";
}

// Download Document

output.onclick = function () {
    const uri = canvas.toDataURL();
    var link = document.createElement('a');
    link.download = filename;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

// Load Document

input.onchange = function (ev) {
    const file = ev.target.files[0]; // get the file
    updateName(file.name);
    const blobURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = blobURL;

    img.onerror = function () {
        URL.revokeObjectURL(this.src);
        // Todo: handle the failure properly
        console.log("Cannot load image: " + filename);
    };

    img.onload = function () {
        URL.revokeObjectURL(this.src);
        updateSize(img.height, img.width);
        clearHistory();
        resizeCanvas();
        ctx.beginPath();
        ctx.drawImage(img, 0, 0, width, height);
        ctxt.closePath();
        zoomReset.click();
        adjustZoom();
    };
}