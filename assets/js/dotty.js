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

let mainTitle = document.getElementById("main-title");
let win = document.getElementById("win");
let colorInput = document.getElementById("color");
let alphaInput = document.getElementById("alpha");
let colorHistoryView = document.getElementById("color-history");
let colorChipTemplate = document.getElementById("color-chip");
let pen = document.getElementById("pen");
let pencil = document.getElementById("pencil");
let eraser = document.getElementById("eraser");
let undoButton = document.getElementById("undo-btn");
let redoButton = document.getElementById("redo-btn");
let name = "My Cool Art";
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
    zoom += 0.25;
    adjustZoom();
};
let zoomOut = document.getElementById("zoom-out");
zoomOut.onclick = function () {
    zoom -= 0.25;
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

var historyBack = [];
var historyForward = [];

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

const updateChips = function() {
    colorHistoryView.innerHTML = "";
    for (const color of colorHistory) {
        const clone = colorChipTemplate.content.cloneNode(true);
        let button = clone.querySelector("button");
        button.textContent = color;
        button.style.color = color;
        button.style.backgroundColor = color;
        button.onclick = () => {
            currentColor = color;
            colorInput.value = currentColor.slice(0, 7);
            alphaInput.value = (Number.parseInt(currentColor.slice(7), 16) / 255) * 100;
        }
        colorHistoryView.appendChild(button);
    }
}

const updateColor = function() {
    currentColor = colorInput.value + Math.floor(((alphaInput.value / 100) * 255)).toString(16);
    colorHistory.push(currentColor);
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
    paintHistory(localStorage.getItem('canvas'));
    historyBack = JSON.parse(localStorage.getItem('undo'));
    colorHistory = JSON.parse(localStorage.getItem('colors'));
}
loadSave();

// Draw

var drawMode = pen.value;
const updateDrawMode = function() {
    drawMode = pen.checked ? pen.value : eraser.checked ?  eraser.value : pencil.value;
}
updateDrawMode();
pen.onchange = updateDrawMode;
eraser.onchange = updateDrawMode;
pencil.onchange = updateDrawMode;

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
    name = newName;
    document.getElementById("name").textContent = name;
}
updateName(name);

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
    link.download = name;
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
        console.log("Cannot load image: " + name);
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