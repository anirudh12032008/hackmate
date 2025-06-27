const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let panting = false;


const colors = document.getElementById('colors');
const brush = document.getElementById('brush');

const btn = document.getElementById('clear');


canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stop);


function start(e) {
  panting = true;
  ctx.beginPath();
  ctx.moveTo(e.clientX, e.clientY);
}

function draw(e) {
    if (!panting) return;
    ctx.lineTo(e.clientX, e.clientY);
    ctx.strokeStyle = colors.value;
    ctx.lineWidth = brush.value;
    ctx.stroke();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
}


function stop() {
  panting = false;
  ctx.closePath();
}

btn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
