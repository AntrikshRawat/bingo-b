const setupSocketHandlers = (io, gameService) => {
 io.on("connection", (socket) => {
   socket.on("joinRoom", (roomCode,name,callback) => {
     const room = gameService.createOrJoinRoom(roomCode, socket.id,name);
     if(!room) {
      callback("Room is Full.");
      return;
     }
     socket.join(roomCode);
     io.to(roomCode).emit('playersName',room.getPlayersName());
     io.to(roomCode).emit("roomState", room);
   });

   socket.on("submitGrid", (roomCode) => {
     const room = gameService.rooms[roomCode];
     if (!room?.players[socket.id]) {
       socket.emit("error", "Invalid room or player");
       return;
     }

     room.setPlayerReady(socket.id);
     
     if (room.areAllPlayersReady()) {
       room.gameStarted = true;
       io.to(roomCode).emit("startGame", room);
       io.to(socket.id).emit("changeTurn", roomCode, false);
     } else {
       io.to(roomCode).emit("roomState", room);
       io.to(socket.id).emit("changeTurn", roomCode, true);
     }
   });

   socket.on("cellClick", (roomCode, clickedValue) => {
     const room = gameService.rooms[roomCode];
     if (room?.gameStarted) {
       io.to(roomCode).emit("updateCell", clickedValue);
       
       const nextPlayerId = gameService.getNextPlayer(roomCode, socket.id);
       if (nextPlayerId) {
         io.to(nextPlayerId).emit("changeTurn", roomCode, true);
         io.to(socket.id).emit("changeTurn", roomCode, false);
       }
     }
   });

   socket.on("resetGame", (roomCode, grid) => {
     const room = gameService.rooms[roomCode];
     if (room) {
       room.reset();
       io.to(roomCode).emit("resetGame", roomCode, grid);
       io.to(roomCode).emit("roomState", room);
     }
   });

   socket.on("checkRoom", (roomCode, callback) => {
     if (typeof callback !== "function") return;
     const result = gameService.checkRoom(roomCode);
     callback(result);
   });

   socket.on("gameOver", (roomCode) => {
     const room = gameService.rooms[roomCode];
     if (room) {
       room.gameStarted = false;
       io.to(roomCode).emit("roomState", room);
       
       Object.keys(room.players).forEach(playerId => {
         io.to(playerId).emit("gameResult", playerId === socket.id);
       });
     }
   });

   socket.on("disconnect", () => {
     const result = gameService.handlePlayerDisconnect(socket.id);
     if (result) {
      const emptyGrid = Array(5).fill(null).map(() => Array(5).fill(null));
       io.to(result.roomCode).emit("resetGame",result.roomCode,emptyGrid);
       io.to(result.roomCode).emit('playersName',room.getPlayersName());
     }
   });
 });
}

module.exports = setupSocketHandlers;