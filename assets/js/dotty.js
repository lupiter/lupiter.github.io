// TODO:
// * select and move
// * hot keys & keyboard shortcuts

let canvas = document.getElementById("canvas");
let canvasWrapper = document.getElementById("canvas-wrapper");
let ctx = canvas.getContext('2d');
let output = document.getElementById("download");
let input = document.getElementById("file");

let newMenu = document.getElementById("new");
let modalNew = document.getElementById("modal-wrapper-new");
let aboutMenu = document.getElementById("about");
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
let bucket = document.getElementById("bucket");

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
    canvas.style.backgroundSize = (zoom * 2) + "px";
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
    drawMode = [pen, eraser, pencil, dropper, bucket].find((tool) => tool.checked).value;
}
updateDrawMode();
pen.onchange = updateDrawMode;
eraser.onchange = updateDrawMode;
pencil.onchange = updateDrawMode;
dropper.onchange = updateDrawMode;
bucket.onchange = updateDrawMode;

let mouseDown = false;

const floodFill = function (startX, startY) {
    // Credit: Tom Cantwell https://cantwell-tom.medium.com/flood-fill-and-line-tool-for-html-canvas-65e08e31aec6
    let imageData = ctx.getImageData(0, 0, height, width);

    let start = (startY * width + startX) * 4;
    let pixel = imageData.data.slice(start, start + 16);
    // exit if color is the same
    let color = pixelToColor(pixel);
    let newColor = colorToPixel(currentColor);
    if (currentColor === color) {
        return;
    }

    const matchStartColor = (pixelPos) => {
        let col = pixelToColor(imageData.data.slice(pixelPos, pixelPos + 16));
        return col === color;
    }
    const colorPixel = (pixelPos) => {
        imageData.data[pixelPos] = newColor.r;
        imageData.data[pixelPos + 1] = newColor.g;
        imageData.data[pixelPos + 2] = newColor.b;
        imageData.data[pixelPos + 3] = newColor.a;
    }

    let pixelStack = [[startX, startY]];
    let newPos, x, y, pixelPos, reachLeft, reachRight;
    fill();
    function fill () {
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
    ctx.putImageData(imageData, 0, 0);
}

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
    } else if (drawMode == bucket.value) {
        floodFill(x,y);
    }
    ctx.closePath();
}

const onStart = function (e) {
    addHistory();
    paint(e);
    mouseDown = true;
}

const pixelToColor = function (imageData) {
    const pixel = new DataView(imageData.buffer);
    const pixelToHex = (idx) => ('00'+(pixel.getUint8(idx).toString(16))).slice(-2);
    return "#" + pixelToHex(0) + pixelToHex(1) + pixelToHex(2) + pixelToHex(3);
}

const colorToPixel = function (color) {
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

const onStop = function (e) {
    mouseDown = false;
    if (drawMode == dropper.value) {
        const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
        const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
        setColor(pixelToColor(ctx.getImageData(x, y, 1, 1).data));
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

// Keyboard Shortcuts

document.onkeyup = (e) => {
    console.log(e);
    if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
            case 'S':
            case 's':
                download();
                e.preventDefault();
                break;
            case 'O':
            case 'o':
                open();
                e.preventDefault();
                break;
            case 'N':
            case 'n':
                newDocument();
                e.preventDefault();
                break;
            case '?':
                about();
                e.preventDefault();
                break;
            case 'z':
                if (!e.shiftKey) {
                    historyGoBack();
                    e.preventDefault();
                    break;
                }
            case 'Z':
                historyGoForward();
                e.preventDefault();
                break;
        }
    } else {
        switch(e.key) {
            case 'b':
                pencil.click();
                break;
            case 'e':
                eraser.click();
                break;
            case 'g':
                bucket.click();
                break;
            case 'i':
                dropper.click();
                break;
            case 'p':
                pen.click();
                break;
        }
    }

}

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

const newDocument = function () {
    modalNew.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}

newMenu.onclick = newDocument;

// About Dialog

const about = function () {
    console.log("show about");
    modalAbout.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
};

aboutMenu.onclick = about;

modalAbout.onclick = function () {
    modalAbout.style.display = "none";
    mainTitle.className = "title-bar";
}

// Download Document

const download = function () {
    const uri = canvas.toDataURL();
    var link = document.createElement('a');
    link.download = filename;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

output.onclick = download;

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