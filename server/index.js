const express = require('express');
require('dotenv').config();
const http = require('http');
const path = require('path');
const { createClient } = require('pexels');

const app = express();
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const pexelsClient = createClient(PEXELS_API_KEY);





app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await pexelsClient.photos.search({ query: prompt, per_page: 1 });

    if (!response.photos || response.photos.length === 0) {
      return res.status(404).json({ error: 'No image found for this prompt.' });
    }

    const imageUrl = response.photos[0].src.large2x;  // You can also use .original for higher res
    res.json({ imageUrl });

  } catch (err) {
    console.error('Pexels API Error:', err);
    res.status(500).json({ error: 'Failed to fetch image.' });
  }
});






const roomCanvases = {};
io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
    if (roomCanvases[room]) {
      socket.emit("sync-canvas", { dataUrl: roomCanvases[room] });
    }
  });
  socket.on("draw", ({ x, y, color, size, room }) => {
    socket.to(room).emit("draw", { x, y, color, size });
  });
  socket.on("line", ({ x1, y1, x2, y2, color, size, room }) => {
    socket.to(room).emit("line", { x1, y1, x2, y2, color, size });
  });
  socket.on("clear", ({ room }) => {
    socket.to(room).emit("clear");
  });
  socket.on("image", ({ x, y, src, room }) => {
    socket.to(room).emit("image", { x, y, src });
  });
  socket.on("text", ({ x, y, text, color, size, room }) => {
    socket.to(room).emit("text", { x, y, text, color, size });
  });
  socket.on("sync-canvas", ({ dataUrl, room }) => {
    roomCanvases[room] = dataUrl;
    socket.to(room).emit("sync-canvas", { dataUrl });
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});