const Room = require('../models/Room');

class TournamentService {
  constructor() {
    this.tournaments = {};
    this.hosts = {};
  }
  createOrJoinTournament(tourCode, socketId,name) {
    if (!this.tournaments[tourCode]) {
      this.tournaments[tourCode] = new Room(tourCode);
    }
    if(this.tournaments[tourCode].isRoomFull()) {
      return false;
    }
    this.tournaments[tourCode].addPlayer(socketId,name);
    this.hosts[tourCode] = this.tournaments[tourCode].changeHost();
    return this.tournaments[tourCode];
  }
  getHost(tournamentId) {
    return this.hosts[tournamentId];
  }
  handlePlayerDisconnect(socketId) {
    for (const [tourCode, room] of Object.entries(this.tournaments)) {
      if (room.players[socketId]) {
        room.removePlayer(socketId);
        this.hosts[tourCode] = room.changeHost();
        if (Object.keys(room.players).length === 0) {
          delete this.tournaments[tourCode];
          delete this.hosts[tourCode];
          return null;
        }
        return { tourCode, room};
      }
    }
    return null;
  }
  checkRoom(tourCode) {
    const tour = this.tournaments[tourCode];
    if (!tour) {
      return { status: false, message: "Room/Tournament does not exist." };
    }
    if (tour.isRoomFull()) {
      return { status: false, message: "Tournament is full. Please join or create another Tournament." };
    }
    return { status: true, message: "Joining the Tournament." };
  }
}

module.exports = TournamentService;