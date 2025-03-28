const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const ALLOWED_ORIGINS = ['https://bingo-f.vercel.app', 'http://localhost:5173'];
const PORT = process.env.PORT || 5000;

const createServer = () => {
  const app = express();
  app.use(cors({ origin: ALLOWED_ORIGINS }));
  
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: ALLOWED_ORIGINS }
  });

  return { server, io };
};

module.exports = {
  createServer,
  PORT
};