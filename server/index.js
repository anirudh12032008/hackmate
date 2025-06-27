const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  console.log('🟢 New user connected');

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data); 
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear'); 
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
