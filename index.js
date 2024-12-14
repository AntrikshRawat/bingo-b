const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5000;
const server = http.createServer(app); // Correct server creation

app.use(cors({ origin: 'https://bingo-f.vercel.app' })); // Keep consistent with frontend URL

const io = new Server(server, {
  cors: {
    origin: 'https://bingo-f.vercel.app', // Replace with your frontend URL
  },
});

// In-memory storage for rooms
const rooms = {};

// WebSocket connection handling
io.on("connection", (socket) => {

  // Join a room
  socket.on("joinRoom", (roomCode) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: {},
        gameStarted: false,
      };
    }
    const room = rooms[roomCode];
    socket.join(roomCode);

    room.players[socket.id] = {
      grid: Array(5).fill(null).map(() => Array(5).fill(null)),
      ready: false,
    };

    io.to(roomCode).emit("roomState", room);
  });

  // Handle grid submission
  socket.on("submitGrid", (roomCode) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("error", "Room not found.");
      return;
    }
    const player = room.players[socket.id];
    if (!player) {
      socket.emit("error", "Player not found in the room.");
      return;
    }

    player.ready = true;

    const allReady = Object.values(room.players).every((player) => player.ready);
    if (allReady) {
      room.gameStarted = true;
      io.to(roomCode).emit("startGame", room);
      io.to(socket.id).emit("changeTurn", roomCode, false);
    } else {
      io.to(roomCode).emit("roomState", room);
      io.to(socket.id).emit("changeTurn", roomCode, true);
    }
  });

  // Handle cell click
  socket.on("cellClick", (roomCode, clickedValue) => {
    const room = rooms[roomCode];
    if (room && room.gameStarted) {
      io.to(roomCode).emit("updateCell", clickedValue);

      const playerIds = Object.keys(room.players);
      const currentPlayerIndex = playerIds.indexOf(socket.id);
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      const nextPlayerId = playerIds[nextPlayerIndex];

      io.to(nextPlayerId).emit("changeTurn", roomCode, true);
      io.to(socket.id).emit("changeTurn", roomCode, false);
    }
  });

  socket.on("resetGame", (roomCode, grid) => {
    const room = rooms[roomCode];
    if (room) {
      room.gameStarted = false;
      for (const playerId in room.players) {
        room.players[playerId].grid = Array(5).fill(null).map(() => Array(5).fill(null));
        room.players[playerId].ready = false;
      }
      io.to(roomCode).emit("resetGame", roomCode, grid);
      io.to(roomCode).emit("roomState", room);
    }
  });

  socket.on("checkRoom", (roomCode, callback) => {
    if (typeof callback !== "function") return; // Prevent errors if callback is undefined
    const roomExists = rooms[roomCode] !== undefined;
    if (!roomExists) {
      callback({ status: false, message: "Room does not exist. Please enter a valid room code." });
      return;
    }
    const room = rooms[roomCode];
    if (Object.keys(room.players).length >= 2) {
      callback({ status: false, message: "Room is full. Please join or create another room." });
      return;
    }
    callback({ status: true, message: "Room exists. Joining the room." });
  });

  socket.on("gameOver", (roomCode) => {
    const room = rooms[roomCode];
    if (room) {
      room.gameStarted = false;
      io.to(roomCode).emit("roomState", room);
      for (const playerId in room.players) {
        if (playerId === socket.id) {
          io.to(playerId).emit("gameResult", true);
        } else {
          io.to(playerId).emit("gameResult", false);
        }
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      if (rooms[roomCode].players[socket.id]) {
        delete rooms[roomCode].players[socket.id];

        if (Object.keys(rooms[roomCode].players).length === 0) {
          delete rooms[roomCode];
        } else {
          io.to(roomCode).emit("roomState", rooms[roomCode]);
        }
        break;
      }
    }
  });
});

// Start the server (fix)
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
