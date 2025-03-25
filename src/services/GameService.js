const Room = require('../models/Room');

class GameService {
  constructor() {
    this.rooms = {};
  }

  createOrJoinRoom(roomCode, socketId,name) {
    if (!this.rooms[roomCode]) {
      this.rooms[roomCode] = new Room();
    }
    else if(this.rooms[roomCode] && this.rooms[roomCode].isRoomFull()) {
      return false;
    }
    this.rooms[roomCode].addPlayer(socketId,name);
    return this.rooms[roomCode];
  }

  handlePlayerDisconnect(socketId) {
    for (const [roomCode, room] of Object.entries(this.rooms)) {
      if (room.players[socketId]) {
        room.removePlayer(socketId);
        if (Object.keys(room.players).length === 0) {
          delete this.rooms[roomCode];
          return null;
        }
        return { roomCode, room };
      }
    }
    return null;
  }

  checkRoom(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) {
      return { status: false, message: "Room does not exist. Please enter a valid room code." };
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