const { createServer, PORT } = require('./src/config/server');
const GameService = require('./src/services/GameService');
const setupSocketHandlers = require('./src/handlers/socketHandlers');
const tournamentHander = require('./src/handlers/tournamentHandler');
const TournamentService = require('./src/services/TournamentService');

const { server, io } = createServer();
const gameService = new GameService();
const tournamentService = new TournamentService();

setupSocketHandlers(io, gameService);
tournamentHander(io,tournamentService);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});