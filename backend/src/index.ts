import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from "socket.io";
import { UserManager } from './managers/UserManager';
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const userManager = new UserManager();

io.on('connection', (socket) => {
  console.log('a user connected');
  userManager.addUser(socket)
  socket.on("disconnect", () => {
    console.log('Disconnected');
    userManager.removeUser(socket.id);
  })
});

server.listen(3000, () => {
  console.log('listening on :3000');
});
