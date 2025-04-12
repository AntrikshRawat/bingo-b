const tournamentHander = (io, tourService) => {
 io.on("connection", (socket) => {
   socket.on("joinTournament", (tournamentId, name, wasHost, callback) => {
     const room = tourService.createOrJoinTournament(tournamentId, socket.id, name, wasHost);
     if(room) {
      socket.join(tournamentId);
      io.to(tournamentId).emit('playersName',room.getPlayersName());
      const host = tourService.getHost(tournamentId);
      io.to(tournamentId).emit('host', { socketId: host});
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
     if (result.isHostChange) {
       const newHost = tourService.getHost(result.tourCode);
       io.to(result.tourCode).emit('host', { socketId: newHost });
     }
   }
  }
  socket.on("suffled",(tourCode,index)=>{
    io.to(tourCode).emit("changed",index);
  })
  socket.on("startTournament", (tourCode, index) => {
    const { matches, players1, players2 } = tourService.createTournamentRooms(tourCode, index);
  
    players1.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player);
      if (playerSocket) {
        playerSocket.join(matches[0]); // Add to match 1 room
        playerSocket.emit("round1", {round:1, matchRoom: matches[0] }); // Emit to the player's socket
      }
    });
    
    players2.forEach((player) => {
      const playerSocket = io.sockets.sockets.get(player);
      if (playerSocket) {
        playerSocket.join(matches[1]); // Add to match 2 room
        playerSocket.emit("round1", {round:1, matchRoom: matches[1] }); // Emit to the player's socket
      }
    });
    setTimeout(()=>{
      io.to(matches[0]).emit("istournament",{status:true,round:1,isWinner:false});
      io.to(matches[1]).emit("istournament",{status:true,round:1,isWinner:false});
    },1200);
  });
  socket.on('roundover',(roomId)=>{
      const tourId = tourService.handleRound(1,roomId,socket.id,false);
      io.to(roomId).emit("backToTour",tourId);
      if(tourService.isNextRoundReady(tourId)) {
        const {finalRounds, winners, losers} = tourService.createFinalRound(tourId);
        winners.forEach((player) => {
          const playerSocket = io.sockets.sockets.get(player);
          if (playerSocket) {
            playerSocket.join(finalRounds[0]); // Add to match 1 room
            setTimeout(()=>{
              playerSocket.emit("round2", {round:2, matchRoom: finalRounds[0]});
            },4000);
             // Emit to the player's socket
          }
        });
        
        losers.forEach((player) => {
          const playerSocket = io.sockets.sockets.get(player);
          if (playerSocket) {
            playerSocket.join(finalRounds[1]); // Add to match 2 room
            setTimeout(()=>{
              playerSocket.emit("round2", {round:2, matchRoom: finalRounds[1]});
            },4000); // Emit to the player's socket
          }
        });
        setTimeout(()=>{
          io.to(finalRounds[0]).emit("istournament",{status:true,round:2,isWinner:true });
          io.to(finalRounds[1]).emit("istournament",{status:true,round:2,isWinner:false });
        },5200);
      }
  })
  socket.on('finalEnd',(roomId,isWinner)=>{
    const result = tourService.handleRound(2,roomId,socket.id,isWinner);
    io.to(roomId).emit("backToTour",result.tourId);
    setTimeout(() => {
      io.to(result.tourId).emit("finalResult",result);
    }, 1350); 
  })
  socket.on('sendWinners',(tourId)=>{
    const winners = tourService.getWinners(tourId);
    io.to(tourId).emit("winners",winners);
  })
  socket.on('sendLoosers',(tourId)=>{
    const loosers = tourService.getLooser(tourId);
    io.to(tourId).emit("loosers",loosers);
  })
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