const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Function to generate a random room code
function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();  // Generate a 6-character room code
}

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle room creation
  socket.on('create room', () => {
    const roomCode = generateRoomCode();  // Generate a random room code
    socket.join(roomCode);  // The user joins this room
    socket.emit('room created', roomCode);  // Send the room code back to the creator
    console.log(`Room created: ${roomCode}`);
  });

  // Handle joining an existing room
  socket.on('join room', (roomCode) => {
    const rooms = io.sockets.adapter.rooms;  // Get all rooms
    if (rooms.has(roomCode)) {  // Check if the room exists
      socket.join(roomCode);  // The user joins the room
      socket.emit('room joined', roomCode);  // Notify the client that they've joined the room
      console.log(`User joined room: ${roomCode}`);
    } else {
      socket.emit('error message', 'Room code is invalid.');  // If the room doesn't exist, send an error
    }
  });

  // Handle real-time typing (keystrokes or button presses)
  socket.on('typing', (data) => {
    const { room, message } = data;  // Get the room and message
    socket.to(room).emit('typing', { message: message });  // Broadcast the typing event to everyone except the sender
    console.log(`Message sent to room ${room}: ${message}`);
  });

  // Handle the delete button action that clears the other user's input
  socket.on('clear for other', (data) => {
    const { room } = data;
    socket.to(room).emit('clear for other');  // Broadcast the clear signal to the other users in the room
    console.log(`Clear signal sent to room ${room}`);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server on port 3000
http.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
