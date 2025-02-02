// TODO
// * select and move
// SOMEDAY
// * ios ui zoom
// * make title editable by double-clicking it, or long-press
// * easter egg?


// Hey, if your reading this, I can write better code I just chose to be lazy. Don't do what I do.

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
let exportMenu = document.getElementById("export-menu");
let exportModal = document.getElementById("modal-wrapper-export");

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
let move = document.getElementById("move");

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
let zoomInButton = document.getElementById("zoom-in");
let zoomInMenu = document.getElementById("zoom-in-menu");
const zoomIn = function () {
    zoom += 3;
    adjustZoom();
};
zoomInButton.onclick = zoomIn;
zoomInMenu.onclick = zoomIn;
let zoomOutButton = document.getElementById("zoom-out");
let zoomOutMenu = document.getElementById("zoom-out-menu");
const zoomOut = function () {
    zoom -= 3;
    adjustZoom();
};
zoomOutButton.onclick = zoomOut;
zoomOutMenu.onclick = zoomOut;
let zoomResetButton = document.getElementById("zoom-reset");
let zoomResetMenu = document.getElementById("zoom-fit-menu");
const zoomReset = function () {
    if (canvasWrapper.offsetWidth  < canvasWrapper.offsetHeight ) {
        zoom = Math.floor(canvasWrapper.offsetWidth / width);
    } else {
        zoom = Math.floor(canvasWrapper.offsetHeight / height);
    }
    adjustZoom();
};
zoomResetButton.onclick = zoomReset;
zoomResetMenu.onclick = zoomReset;
zoomReset();

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

const paintHistory = function (blobURL, x = 0, y = 0) {
    const img = new Image();
    img.src = blobURL;

    img.onload = function () {
        URL.revokeObjectURL(this.src);
        ctx.beginPath();
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, x, y, width, height);
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
    drawMode = [pen, eraser, pencil, dropper, bucket, move].find((tool) => tool.checked).value;
}
updateDrawMode();
pen.onchange = updateDrawMode;
eraser.onchange = updateDrawMode;
pencil.onchange = updateDrawMode;
dropper.onchange = updateDrawMode;
bucket.onchange = updateDrawMode;
move.onchange = updateDrawMode;

let mouseDown = false;
let moveOrigin = undefined;
let initialTouch = undefined;
let lastTouch = undefined;

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

const getCanvasMovement = function () {
    if (canvas.style.translate === "" || canvas.style.translate === "0px") {
        return { x: 0, y: 0 };
    }
    console.log(canvas.style.translate);
    const [x, y] = canvas.style.translate.split(" ").map(x => Number.parseInt(x.slice(undefined, -2)));
    return { x, y };
}

const getCanvasZoom = function () {
    return Number.parseInt(canvas.style.scale);
}

const midpoint = function (touches) {
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

const distance = function (touches) {
    // we'll assume 2 touches
    let [t1, t2] = touches;
    let x = Math.abs(t1.screenX - t2.screenX);
    let y = Math.abs(t1.screenY - t2.screenY);
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

const calcPanAndSpread = function() {
    // pan
    const startMove = midpoint(initialTouch);
    const endMove = midpoint(lastTouch);
    const pan = {
        x: endMove.x - startMove.x,
        y: endMove.y - startMove.y
    };

    // spread
    const startSpread = distance(initialTouch);
    const endSpread = distance(lastTouch);
    const goalSpread = endSpread - startSpread;
    const spread = (goalSpread / 100 + 1);

    return {pan, spread};
}

const paint = function (e) {
    // check if we're panning or zooming with two fingers
    if (e.touches && e.touches.length > 1) {
        // it's multitouch! oh no!
        if (e.touches.length > 2) {
            // sorry, don't know what to do with that many touches
            return;
        }
        if (!initialTouch) {
            initialTouch = e.touches;
            return;
        }
        lastTouch = e.touches;
        const { pan, spread } = calcPanAndSpread();
        canvas.style.translate = pan.x + "px " + pan.y + "px";
        canvas.style.scale = "" + spread;
        return;
    }

    // okay, continue painting
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
    } else if (drawMode == move.value) {
        const current = getCanvasMovement();
        if (current.x != 0 || current.y != 0) {
            const expected = Math.floor((x - moveOrigin.x) * zoom + current.x) + "px " + Math.floor((y - moveOrigin.y) * zoom + current.y) + "px";
            if (expected != current) {
                canvas.style.translate = expected;
            }
        } else {
            canvas.style.translate = Math.floor((x - moveOrigin.x) * zoom) + "px " + Math.floor((y - moveOrigin.y) * zoom) + "px";
        }
    }
    ctx.closePath();
}

const onStart = function (e) {
    addHistory();
    if (e.touches && e.touches.length === 2) {
        initialTouch = e.touches;
    }
    if (drawMode === move.value) {
        const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
        const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
        moveOrigin = { x, y };
    }
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
    if (!!initialTouch && !!lastTouch) {
        const { pan, spread } = calcPanAndSpread();
        console.log(pan, spread, canvas.style.translate, canvas.style.scale);
        zoom = zoom * spread;
        adjustZoom();
        canvas.style.scale = "";

        canvas.style.translate = "";
        canvasWrapper.scrollTop = canvasWrapper.scrollTop - pan.y;
        canvasWrapper.scrollLeft = canvasWrapper.scrollLeft - pan.x;
        
        lastTouch = undefined;
        initialTouch = undefined;
        return;
    }
    if (drawMode === dropper.value) {
        const x = Math.floor((e.offsetX ? e.offsetX : e.layerX) / zoom);
        const y = Math.floor((e.offsetY ? e.offsetY : e.layerY) / zoom);
        setColor(pixelToColor(ctx.getImageData(x, y, 1, 1).data));
    } else if (drawMode === move.value) {
        const current = getCanvasMovement().map(x => Math.floor(x / zoom));
        const data = canvas.toDataURL();
        paintHistory(data, current[0], current[1]);
        canvas.style.translate = "";
        moveOrigin = undefined;
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

// Menus

const menus = document.querySelectorAll('ul[role="menubar"] > li[role="menuitem"]');
const closeOpenMenus = () => {
    const currentlyOpen = document.querySelector("[role='menuitem'][aria-expanded='true']");
    if (!!currentlyOpen) {
        currentlyOpen.querySelector("[role='menu']").style.display = 'none';
        currentlyOpen.setAttribute('aria-expanded', false);
        currentlyOpen.onclick = openMenu;
    }
}
const openMenu = (e) => {
    closeOpenMenus();
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
    target.onclick = closeMenu;
    document.onclick = closeMenu;
};
const closeMenu = (e) => {
    closeOpenMenus();
    document.onclick = undefined;
    console.log(e.target);
    if (!e.target instanceof HTMLInputElement) {
        e.preventDefault();
    }
}
menus.forEach(e => {
    e.onclick = openMenu;
    e.onkeydown = (k) => {
        if (k.key === 'enter' || key === 'space') {
            openMenu(k);
        }
    }
})

// Keyboard Shortcuts

document.onkeydown = (e) => {
    if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
            case 'E':
            case 'e':
                exportArt();
                e.preventDefault();
                break;
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
            case '=':
                if (!e.shiftKey) {
                    zoomIn();
                    e.preventDefault();
                    break;
                }
            case '+':
                zoomReset();
                e.preventDefault();
                break;
            case '-':
                zoomOut();
                e.preventDefault();
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
    zoomReset();
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
    clearHistory();
    updateName(document.getElementById("new-name").value);
    ctx.clearRect(0, 0, height, width);
    const newHeight = document.getElementById("new-height").value;
    const newWidth = document.getElementById("new-width").value;
    updateSize(newHeight, newWidth);
    resizeCanvas();
    zoomReset();
    adjustZoom();
    autoSave();
}

const newDocument = function () {
    modalNew.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}

newMenu.onclick = newDocument;

// Export Dialog

const exportArt = function () {
    exportModal.style.display = "flex";
    mainTitle.className = "inactive-title-bar";
}
exportMenu.onclick = exportArt;
let exportSize = document.getElementById("export-size");
let exportCancel = document.getElementById("export-cancel");
exportCancel.onclick = function () {
    exportModal.style.display = "none";
    mainTitle.className = "title-bar";
}
let exportConfirm = document.getElementById("export-confirm");
exportConfirm.onclick = function () {
    exportCancel.click();
    const requestedSize = Number.parseInt(document.querySelector(".export-size-grid input:checked").value);
    const exportCanvas = document.createElement('canvas');
    const exportZoom = Math.ceil(requestedSize / width);
    exportCanvas.width = exportZoom * width;
    exportCanvas.height = exportZoom * height;
    const blobURL = canvas.toDataURL();

    const img = new Image();
    img.src = blobURL;

    img.onload = function () {
        URL.revokeObjectURL(this.src);
        document.body.appendChild(exportCanvas);
        exportCtx = exportCanvas.getContext('2d');
        exportCtx.imageSmoothingEnabled = false;
        exportCtx.beginPath();
        exportCtx.drawImage(img, 0, 0, exportZoom * width, exportZoom * height);
        exportCtx.closePath();

        const uri = exportCanvas.toDataURL();
        document.body.removeChild(exportCanvas);
        delete exportCanvas;

        var link = document.createElement('a');
        link.download = 'export-' + filename + '.png';
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        delete link;
    };
}

// About Dialog

const about = function () {
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
    window.setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        delete link;
    }, 1);
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
        if (img.width > 256 || img.height > 256) {
            alert("Sorry, this image is too large. Files should be no larger than 256x256 pixels");
            return;
        } 

        URL.revokeObjectURL(this.src);
        updateSize(img.height, img.width);
        clearHistory();
        resizeCanvas();
        ctx.beginPath();
        ctx.drawImage(img, 0, 0, width, height);
        ctxt.closePath();
        zoomReset();
        adjustZoom();
    };
}