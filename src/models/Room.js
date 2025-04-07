class Room {
 constructor(tournamentId = null) {
   this.players = {};
   this.gameStarted = false;
   this.tournamentId = tournamentId;
 }
 addPlayer(socketId,name) {
   this.players[socketId] = {
     grid: Array(5).fill(null).map(() => Array(5).fill(null)),
     ready: false,
     name:name
   };
 }
 playerInfo(index) {
  return Object.keys(this.players)[index];
 }
 getPlayersName(players = null) {
  if(!players)
  return Object.keys(this.players).map(id => this.players[id].name);
  const playerNames = Object.keys(this.players).filter(player => players.includes(player)).map(player => this.players[player].name);
  return playerNames;
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