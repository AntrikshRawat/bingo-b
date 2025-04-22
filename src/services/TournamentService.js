const Room = require('../models/Room');

class TournamentService {
  constructor() {
    this.tournaments = {};
    this.hosts = {};
    this.matches = {};
    this.winners = {};
    this.losers = {};
    this.roomToTournament = {};
    this.finalMatchReports= {};
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
    if(winners + losers <= 2) return false;
    return true;
  }
  createFinalRound(tourCode) {
    const tourRoom = this.tournaments[tourCode];
    if (!tourRoom) return null;
  
    const winners = this.winners[tourCode];
    const losers = this.losers[tourCode];

    const room1 = this.generateRoomCode();
    const room2 = this.generateRoomCode();

    const finalRounds = [room1,room2];
    this.matches[tourCode][room1] = winners.slice();
    this.matches[tourCode][room2] = losers.slice();

  
    this.roomToTournament[finalRounds[0]] = tourCode;
    this.roomToTournament[finalRounds[1]] = tourCode;
  
    return { finalRounds, winners, losers };
  }
  
  createOrJoinTournament(tourCode, socketId, name, wasHost) {
    if (!this.tournaments[tourCode]) {
      this.tournaments[tourCode] = new Room(tourCode);
      this.hosts[tourCode] = socketId;
      this.matches[tourCode] = {};
      this.winners[tourCode] = [];
      this.losers[tourCode] = [];
      this.finalMatchReports[tourCode] = [];

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

  handleRound(round, roomId, socketId, isWinner) {
    const tourId = this.roomToTournament[roomId];
    if (!tourId || !this.matches[tourId]) return tourId;
    const players = this.matches[tourId][roomId];
    const[winner,loser] = socketId===players[0]?[players[0],players[1]]:[players[1],players[0]]
  
    if (round === 1) {
      if(this.winners[tourId].includes(winner) || this.losers[tourId].includes(loser) ||this.winners[tourId].includes(loser) || this.losers[tourId].includes(winner))
      return tourId;
      this.winners[tourId].push(winner);
      this.losers[tourId].push(loser);
      return tourId;
    }
  
    if (round === 2) {
      const report = {
        players: [winner, loser],
        isWinner // true or false depending on reporter
      };
      if(this.finalMatchReports[tourId].find(r=>r.isWinner===isWinner)) return;

      this.finalMatchReports[tourId].push(report);
      if (this.finalMatchReports[tourId].length === 2) {
        // Both players have reported
        const winnerReport = this.finalMatchReports[tourId].find(r => r.isWinner);
        const loserReport = this.finalMatchReports[tourId].find(r => !r.isWinner);
        if (winnerReport && loserReport) {
          const finalResult = [winnerReport.players[0], winnerReport.players[1], loserReport.players[0]];
          const playersName = this.tournaments[tourId].getPlayersName(finalResult);
          return ({status:true,result:playersName,tourId})
        }
      }
      return({status:false,result:null,tourId});
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
        room.removePlayer(socketId);
        if (Object.keys(room.players).length === 0) {
          delete this.tournaments[tourCode];
          delete this.hosts[tourCode];
          delete this.matches[tourCode];
          delete this.winners[tourCode];
          delete this.losers[tourCode];
          delete this.finalMatchReports[tourCode];
          Object.keys(this.roomToTournament).forEach(roomId => {
            if (this.roomToTournament[roomId] === tourCode) {
              delete this.roomToTournament[roomId];
            }
          });
          return null;
        }
        const wasHost = this.hosts[tourCode] === socketId;
        if (wasHost) {
          this.hosts[tourCode] = room.changeHost();
          return { tourCode, room, isHostChange: true};
        }

        return { tourCode, room, isHostChange: false};
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
