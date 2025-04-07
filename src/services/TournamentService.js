const Room = require('../models/Room');

class TournamentService {
  constructor() {
    this.tournaments = {};
    this.hosts = {};
    this.matches = {};
    this.winners = {};
    this.losers = {};
    this.roomToTournament = {};
  }

  generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.matches[code]); // Prevent duplicate codes
    return code;
  };
  isNextRoundReady(tourCode) {
    const tourRoom = this.tournaments[tourCode];
    if (!tourRoom) return false; // Check if tournament exists
    const winners = this.winners[tourCode].length;
    const losers = this.losers[tourCode].length;
    if (winners + losers < 2) return false; 
    if(winners + losers >= 3) return true; 
    return false; // Not enough players to proceed to the next round
  }
  createFinalRound(tourCode) {
    const tourRoom = this.tournaments[tourCode];
    if (!tourRoom) return null; // Check if tournament exists

    const winners = this.winners[tourCode];
    const losers = this.losers[tourCode];

    const room1 = this.generateRoomCode();
    const room2 = this.generateRoomCode();

    const finalRounds = [room1, room2];

    this.matches[room1] = winners;
    this.matches[room2] = losers;

    this.roomToTournament[`${room1}`] = tourCode;
    this.roomToTournament[`${room2}`] = tourCode;

    return { finalRounds, winners, losers };
  }
  createOrJoinTournament(tourCode, socketId, name, wasHost) {
    if (!this.tournaments[tourCode]) {
      this.tournaments[tourCode] = new Room(tourCode);
      this.hosts[tourCode] = socketId;
      this.matches[tourCode] = {};
      this.winners[tourCode] = [];
      this.losers[tourCode] = [];
    } else if (wasHost) {
      this.hosts[tourCode] = socketId;
    }

    if (this.tournaments[tourCode].isRoomFull()) {
      return false;
    }

    this.tournaments[tourCode].addPlayer(socketId, name);
    return this.tournaments[tourCode];
  }
  getTournament(tourId) {
    return this.tournaments[tourId];
  }

  getHost(tournamentId) {
    return this.hosts[tournamentId];
  }

  createTournamentRooms(tourCode, index) {
    const tourRoom = this.tournaments[tourCode];
    const thisMatches = this.matches[tourCode];

    const players1 = [tourRoom.playerInfo(index[0]), tourRoom.playerInfo(index[1])];
    const players2 = [tourRoom.playerInfo(index[2]), tourRoom.playerInfo(index[3])];

    let room1 = this.generateRoomCode();
    let room2 = this.generateRoomCode();

    thisMatches[room1] = players1;
    thisMatches[room2] = players2;

    this.roomToTournament[`${room1}`] = tourCode;
    this.roomToTournament[`${room2}`] = tourCode;

    return { matches: Object.keys(thisMatches), players1, players2 };
  }
  deleteMatch(tourCode, roomId) {
    if (this.matches[tourCode] && this.matches[tourCode][roomId]) {
      delete this.matches[tourCode][roomId];
    }
    if (this.roomToTournament[roomId]) {
      delete this.roomToTournament[roomId];
    }
  }
  handleRound(round, roomId, socketId,isWinner) {
    const tourId = this.roomToTournament[roomId];
    if (!tourId || !this.matches[tourId]) return null;
    const match = this.matches[tourId]; 
    if (round === 1) {
      if (!match[roomId]) return null; // Ensure room exists
      const loser = match[roomId].find(player => player !== socketId);
      const winner = match[roomId].find(player => player === socketId);
      this.winners[tourId].push(winner);
      if(loser)this.losers[tourId].push(loser);
      return tourId;
    } else if(round === 2) {
      if (!match[roomId]) return null; // Ensure room exists
      const loser = match[roomId].find(player => player !== socketId);
      const winner = match[roomId].find(player => player === socketId);
      this.winners[tourId].push(winner);
      if(isWinner && loser)this.winners[tourId].push(loser);
      return tourId;
    }
    return null;
  }

  getWinners(tourId) {
    const tourRoom = this.tournaments[tourId];
    if(!tourRoom) return;
    const winners = this.winners[tourId];
    return tourRoom.getPlayersName(winners);
  }
  getLooser(tourId) {
    const tourRoom = this.tournaments[tourId];
    if(!tourRoom) return;
    const losers = this.losers[tourId];
    return tourRoom.getPlayersName(losers);
  }
  handlePlayerDisconnect(socketId) {
    for (const [tourCode, room] of Object.entries(this.tournaments)) {
      if (room.players[socketId]) {
        const wasHost = this.hosts[tourCode] === socketId;
        room.removePlayer(socketId);

        if (Object.keys(room.players).length === 0) {
          delete this.tournaments[tourCode];
          delete this.hosts[tourCode];
          delete this.matches[tourCode];
          delete this.winners[tourCode];
          delete this.losers[tourCode];

          
          Object.keys(this.roomToTournament).forEach(roomId => {
            if (this.roomToTournament[roomId] === tourCode) {
              delete this.roomToTournament[roomId];
            }
          });

          return null;
        }

        if (wasHost && Object.keys(room.players).length > 0) {
          this.hosts[tourCode] = room.changeHost();
          return { tourCode, room, isHostChange: true, isReconnecting: false };
        }

        return { tourCode, room, isHostChange: false };
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
