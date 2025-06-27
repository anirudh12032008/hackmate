

const socket = io();

// Get elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

const colors = document.getElementById('colors');
const brush = document.getElementById('brush');
const btn = document.getElementById('clear');

let painting = false;

canvas.addEventListener('mousedown', (e) => {
  painting = true;
  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  ctx.beginPath();
  ctx.moveTo(x, y);
});

canvas.addEventListener('mouseup', () => {
  painting = false;
  ctx.beginPath();
});

canvas.addEventListener('mousemove', (e) => {
  if (!painting) return;

  const x = e.clientX - canvas.offsetLeft;
  const y = e.clientY - canvas.offsetTop;
  const color = colors.value;
  const size = brush.value;

  drawLine(x, y, color, size);
  socket.emit('draw', { x, y, color, size });
});

function drawLine(x, y, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}



btn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear');
});

socket.on('draw', ({ x, y, color, size }) => {
  drawLine(x, y, color, size);
});

socket.on('clear', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});


const colorSwatches = document.querySelectorAll("[data-color]");
  const colorInput = document.getElementById("colors");

  colorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const selectedColor = swatch.getAttribute("data-color");
      colorInput.value = selectedColor;
    });
  });

  colorInput.addEventListener("input", (e) => {
    colorInput.value = e.target.value;
  });
