class Room {
 constructor(tournamentId = null) {
   this.players = {};
   this.gameStarted = false;
   this.tournamentId = tournamentId;
   this.matchWinners = [];
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
 changeHost() {
  const nextHost = Object.keys(this.players);
  return nextHost[0];
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
  if(this.tournamentId)
  return Object.keys(this.players).length >= 4;
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