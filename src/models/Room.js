class Room {
 constructor() {
   this.players = {};
   this.gameStarted = false;
 }

 addPlayer(socketId) {
   this.players[socketId] = {
     grid: Array(5).fill(null).map(() => Array(5).fill(null)),
     ready: false
   };
 }

 removePlayer(socketId) {
   delete this.players[socketId];
 }

 setPlayerReady(socketId) {
   if (this.players[socketId]) {
     this.players[socketId].ready = true;
   }
 }

 areAllPlayersReady() {
   return Object.values(this.players).every(player => player.ready);
 }

 isRoomFull() {
   return Object.keys(this.players).length >= 2;
 }

 reset() {
   this.gameStarted = false;
   Object.keys(this.players).forEach(playerId => {
     this.players[playerId].grid = Array(5).fill(null).map(() => Array(5).fill(null));
     this.players[playerId].ready = false;
   });
 }
}

module.exports = Room;