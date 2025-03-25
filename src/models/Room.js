class Room {
 constructor() {
   this.players = {};
   this.gameStarted = false;
 }

 addPlayer(socketId,name) {
   this.players[socketId] = {
     grid: Array(5).fill(null).map(() => Array(5).fill(null)),
     ready: false,
     name:name
   };
 }
 getPlayersName() {
  return Object.keys(this.players).map(id => this.players[id].name);
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
   return Object.values(this.players).every(player => player.ready) && Object.keys(this.players).length >= 2;
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