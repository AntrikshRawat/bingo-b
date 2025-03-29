const tournamentHander = (io, tourService) => {
 io.on("connection", (socket) => {
   socket.on("joinTournament", (tournamentId,name,callback) => {
     const room = tourService.createOrJoinTournament(tournamentId, socket.id,name);
     if(room) {
      socket.join(tournamentId);
      io.to(tournamentId).emit('playersName',room.getPlayersName());
      const host = tourService.getHost(tournamentId);
      io.to(tournamentId).emit('host',host);
      callback(null);
     }else{
      callback("Tournament is Full.");
     }
   });
   socket.on("checkTour", (tourCode, callback) => {
    if (typeof callback !== "function") return;
    const result = tourService.checkRoom(tourCode);
    callback(result);
  });
  function leave(socketId) {
   const result = tourService.handlePlayerDisconnect(socketId);
   if (result) {
     io.to(result.tourCode).emit("playersName",result.room.getPlayersName());
   }
  }
  socket.on("leaveTour",(roomCode)=>{ 
   socket.leave(roomCode);
   leave(socket.id);
  })
  socket.on("disconnect", () => {
   leave(socket.id);
  });
 });
}

module.exports = tournamentHander;