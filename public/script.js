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

bSwatch.forEach(el => {
  el.addEventListener("click", () => {
    bInp.value = el.getAttribute("data-size");
  });
});
bToggle.addEventListener("click", () => bWrap.classList.toggle("hidden"));

let isDraw = false;
let isErase = false;

const eBtn = document.getElementById("eraser");

eBtn.addEventListener("click", () => {
  isErase = !isErase;
  eBtn.classList.toggle("bg-gray-800", isErase);
  eBtn.classList.toggle("text-white", isErase);
  eBtn.classList.toggle("bg-gray-200", !isErase);
  eBtn.classList.toggle("text-gray-800", !isErase);
});

let isLine = false;
let linePt = null;

const lineBtn = document.getElementById("drawLine");
lineBtn.addEventListener("click", () => {
  isLine = !isLine;
  lineBtn.classList.toggle("bg-purple-800", isLine);
  lineBtn.classList.toggle("text-white", isLine);
  lineBtn.classList.toggle("bg-purple-100", !isLine);
  lineBtn.classList.toggle("text-purple-800", !isLine);
  linePt = null;
});

cvs.addEventListener('mousedown', e => {
  const x = e.clientX - cvs.offsetLeft;
  const y = e.clientY - cvs.offsetTop;

  if (isLine) {
    if (!linePt) {
      linePt = { x, y };
    } else {
      const end = { x, y };
      const c = clrInp.value;
      const s = szInp.value;
      drawLineSeg(linePt.x, linePt.y, end.x, end.y, c, s);
      ioSock.emit('line', { x1: linePt.x, y1: linePt.y, x2: end.x, y2: end.y, color: c, size: s });
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
  const y = e.clientY - cvs.offsetTop;
  const c = isErase ? "#ffffff" : clrInp.value;
  const s = isErase ? eInp.value : szInp.value;

  draw(x, y, c, s);
  ioSock.emit('draw', { x, y, color: c, size: s });
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

ioSock.on('draw', ({ x, y, color, size }) => draw(x, y, color, size));
ioSock.on('line', ({ x1, y1, x2, y2, color, size }) => drawLineSeg(x1, y1, x2, y2, color, size));
ioSock.on('clear', () => ctx.clearRect(0, 0, cvs.width, cvs.height));

clrBtn.addEventListener('click', () => {
  save();
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ioSock.emit('clear');
});

const undo = [];
const redo = [];

function save() {
  undo.push(cvs.toDataURL());
  if (undo.length > 50) undo.shift();
  redo.length = 0;
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
  restore(undo.pop());
});

document.getElementById("redo").addEventListener("click", () => {
  if (!redo.length) return;
  undo.push(cvs.toDataURL());
  restore(redo.pop());
});

const clrSwatch = document.querySelectorAll("[data-color]");
clrSwatch.forEach(el => {
  el.addEventListener("click", () => {
    clrInp.value = el.getAttribute("data-color");
  });
});
clrInp.addEventListener("input", e => {
  clrInp.value = e.target.value;
});
