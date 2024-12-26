const { createServer, PORT } = require('./src/config/server');
const GameService = require('./src/services/GameService');
const setupSocketHandlers = require('./src/handlers/socketHandlers');

const { server, io } = createServer();
const gameService = new GameService();

setupSocketHandlers(io, gameService);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});