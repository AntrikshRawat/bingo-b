const Room = require('../models/Room');

class GameService {
  constructor() {
    this.rooms = {};
  }
createOrJoinRoom(roomCode, socketId, name) {
  let room = this.rooms[roomCode];
  if (!room) {
    room = new Room(roomCode); // Create new room
    this.rooms[roomCode] = room;
  }

  // Check if player with same name already exists (reconnect case)
  const existingPlayerId = Object.keys(room.players).find(
    (id) => room.players[id].name === name
  );

  if (existingPlayerId) {
    // Replace old socketId with new one
    const playerData = room.players[existingPlayerId];
    delete room.players[existingPlayerId];
    room.players[socketId] = playerData;
    return room;
  }

  if (Object.keys(room.players).length >= 2) return null; // room full

  room.addPlayer(socketId, name);

  return room;
}

handlePlayerDisconnect(socketId) {
  for (const roomCode in this.rooms) {
    const room = this.rooms[roomCode];
    if (room.players[socketId]) {
      room.removePlayer(socketId);
      room.reset(); // Reset the game state for all players
      if (Object.keys(room.players).length === 0) {
        delete this.rooms[roomCode];
        return null;
      }
      return {roomCode,room}
    }
  }
}

  checkRoom(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) {
      return null;
    }
    if (room.isRoomFull()) {
      return { status: false, message: "Room is full. Please join or create another room." };
    }
    return { status: true, message: "Joining the room." };
  }

  getNextPlayer(roomCode, currentSocketId) {
    const room = this.rooms[roomCode];
    if (!room) return null;
    
    const playerIds = Object.keys(room.players);
    const currentPlayerIndex = playerIds.indexOf(currentSocketId);
    const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    return playerIds[nextPlayerIndex];
  }
}

module.exports = GameService;