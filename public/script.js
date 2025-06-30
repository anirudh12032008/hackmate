const ioSock = io();
const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');
cvs.width = window.innerWidth * 0.95;
cvs.height = window.innerHeight * 1.5;
const clrInp = document.getElementById('colors');
const szInp = document.getElementById('brush');
const clrBtn = document.getElementById('clear');
const eSwatch = document.querySelectorAll("[data-eraser]");
const eInp = document.getElementById("eraserSize");
const eToggle = document.getElementById("eraserSliderToggle");
const eWrap = document.getElementById("eraserSliderWrap");
let tool = "brush";
eSwatch.forEach(el => {
el.addEventListener("click", () => {
eInp.value = el.getAttribute("data-eraser");
});
});
eToggle.addEventListener("click", () => eWrap.classList.toggle("hidden"));
eInp.addEventListener("input", e => eInp.value = e.target.value);
const bSwatch = document.querySelectorAll("[data-size]");
const bInp = document.getElementById("brush");
const bToggle = document.getElementById("brushSliderToggle");
const bWrap = document.getElementById("brushSliderWrap");
const imgBtn = document.getElementById("addImage");
const imgInput = document.getElementById("imgInput");
const clrSwatch = document.querySelectorAll("[data-color]");
const textBtn = document.getElementById("addText");
const eBtn = document.getElementById("eraser");
const lineBtn = document.getElementById("drawLine");
const undo = [];
const redo = [];
let isAddingText = false;
let isAddingImage = false;
let isDraw = false;
let isErase = false;
let isLine = false;
let linePt = null;
imgBtn.addEventListener("click", () => {
isAddingImage = !isAddingImage;
imgBtn.classList.toggle("bg-blue-800", isAddingImage);
imgBtn.classList.toggle("text-white", isAddingImage);
imgBtn.classList.toggle("bg-blue-100", !isAddingImage);
imgBtn.classList.toggle("text-blue-800", !isAddingImage);
tool = isAddingImage ? "image" : "brush";
updateCursor();
imgInput.click();
});
imgInput.addEventListener("change",()=> {
const file = imgInput.files[0];
if (!file) return;
const img = new Image();
img.src = URL.createObjectURL(file);
img.onload = () => {
cvs.addEventListener('click', placeImg);
function placeImg(e) {
const x = e.clientX - cvs.offsetLeft;
const y = e.clientY - cvs.offsetTop + 30;
const w = 500
const h = w * (img.height / img.width);
ctx.drawImage(img, x, y, w, h);
save();
emitImage( x, y, img.src );
cvs.removeEventListener('click', placeImg);
};
cvs.addEventListener("click", placeImg);
};
});
textBtn.addEventListener("click", () => {
isAddingText = !isAddingText;
textBtn.classList.add("bg-blue-800", "text-white");
textBtn.classList.remove("bg-blue-100", "text-blue-800");
tool = isAddingText ? "text" : "brush";
updateCursor();
});
cvs.addEventListener("click", (e) => {
if (!isAddingText) return;
const x = e.clientX - cvs.offsetLeft;
const y = e.clientY - cvs.offsetTop + 30;
const txt = prompt("Enter your text:");
if (txt) {
ctx.fillStyle = clrInp.value;
ctx.font = `${brush.value * 6}px sans-serif`;
ctx.fillText(txt, x, y);
emitText( x, y, txt );
save();
}
isAddingText = false;
textBtn.classList.remove("bg-blue-800", "text-white");
textBtn.classList.add("bg-blue-100", "text-blue-800");
cvs.style.cursor = "default";
});
bSwatch.forEach(el => {
el.addEventListener("click", () => {
bInp.value = el.getAttribute("data-size");
});
});
bToggle.addEventListener("click", () => bWrap.classList.toggle("hidden"));
eBtn.addEventListener("click", () => {
isErase = !isErase;
tool = isErase ? "eraser" : "brush";
updateCursor();
eBtn.classList.toggle("bg-gray-800", isErase);
eBtn.classList.toggle("text-white", isErase);
eBtn.classList.toggle("bg-gray-200", !isErase);
eBtn.classList.toggle("text-gray-800", !isErase);
});
lineBtn.addEventListener("click", () => {
isLine = !isLine;
tool = isLine ? "line" : "brush";
updateCursor();
lineBtn.classList.toggle("bg-purple-800", isLine);
lineBtn.classList.toggle("text-white", isLine);
lineBtn.classList.toggle("bg-purple-100", !isLine);
lineBtn.classList.toggle("text-purple-700", !isLine);
linePt = null;
});
cvs.addEventListener('mousedown', e => {
const x = e.clientX - cvs.offsetLeft;
const y = e.clientY - cvs.offsetTop +30;
if (isLine) {
if (!linePt) {
linePt = { x, y };
} else {
const end = { x, y };
const c = clrInp.value;
const s = szInp.value;
drawLineSeg(linePt.x, linePt.y, end.x, end.y, c, s);
emitLine(linePt.x, linePt.y, end.x, end.y, c, s);
linePt = null;
}
return;
}
isDraw = true;
save();
ctx.beginPath();
ctx.moveTo(x, y);
});
cvs.addEventListener('mouseup', () => {
isDraw = false;
ctx.beginPath();
});
cvs.addEventListener('mousemove', e => {
if (!isDraw) return;
const x = e.clientX - cvs.offsetLeft;
const y = e.clientY - cvs.offsetTop + 30;
const c = isErase ? "#ffffff" : clrInp.value;
const s = isErase ? eInp.value : szInp.value;
draw(x, y, c, s);
emitDraw(x, y, c, s);
});
clrBtn.addEventListener('click', () => {
save();
ctx.clearRect(0, 0, cvs.width, cvs.height);
emitClear();
});
function draw(x, y, c, s) {
ctx.strokeStyle = c;
ctx.lineWidth = s;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineTo(x, y);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(x, y);
}
function drawLineSeg(x1, y1, x2, y2, c, s) {
ctx.strokeStyle = c;
ctx.lineWidth = s;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();
save();
}
function updateCursor() {
cvs.classList.remove(
"cursor-brush",
"cursor-eraser",
"cursor-line",
"cursor-image",
"cursor-text"
);
cvs.classList.add(`cursor-${tool}`);
}
function save() {
undo.push(cvs.toDataURL());
if (undo.length > 50) undo.shift();
redo.length = 0;
ioSock.emit("sync-canvas", { dataUrl: cvs.toDataURL(), room });
}
function restore(data) {
const img = new Image();
img.onload = () => {
ctx.clearRect(0, 0, cvs.width, cvs.height);
ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
};
img.src = data;
}
document.getElementById("undo").addEventListener("click", () => {
if (!undo.length) return;
redo.push(cvs.toDataURL());
const prev = undo.pop();
restore(prev);
ioSock.emit("sync-canvas", { dataUrl: prev, room });
});
document.getElementById("redo").addEventListener("click", () => {
if (!redo.length) return;
const next = redo.pop();
undo.push(cvs.toDataURL());
restore(next);
ioSock.emit("sync-canvas", { dataUrl: next, room });
});
clrSwatch.forEach(el => {
el.addEventListener("click", () => {
clrInp.value = el.getAttribute("data-color");
});
});
clrInp.addEventListener("input", e => {
clrInp.value = e.target.value;
});

let room = prompt("Enter room code:");
if (!room) room = "default";
ioSock.emit("join-room", room);
document.getElementById("code").textContent = room;
function emitDraw(x, y, c, s) {
ioSock.emit("draw", { x, y, color: c, size: s, room });
}
function emitLine(x1, y1, x2, y2, c, s) {
ioSock.emit("line", { x1, y1, x2, y2, color: c, size: s, room });
}
function emitImage(x, y, src) {
ioSock.emit("image", { x, y, src, room });
}
function emitClear() {
ioSock.emit("clear", { room });
}
function emitText(x, y, text) {
ioSock.emit("text", {
x, y,
text,
color: clrInp.value,
size: brush.value * 6,
room
});
}
ioSock.on('draw', ({ x, y, color, size }) => draw(x, y, color, size));
ioSock.on('line', ({ x1, y1, x2, y2, color, size }) => drawLineSeg(x1, y1, x2, y2, color, size));
ioSock.on('clear', () => ctx.clearRect(0, 0, cvs.width, cvs.height));
ioSock.on("image", ({ x, y, src }) => {
const img = new Image();
img.src = src;
img.onload = () => {
const w = 500;
const h = w * (img.height / img.width);
ctx.drawImage(img, x, y, w, h);
save();
};
});
ioSock.on("text", ({ x, y, text, color, size }) => {
ctx.fillStyle = color;
ctx.font = `${size}px sans-serif`;
ctx.fillText(text, x, y);
save();
});
ioSock.on("sync-canvas", ({ dataUrl }) => {
restore(dataUrl);
});
updateCursor();