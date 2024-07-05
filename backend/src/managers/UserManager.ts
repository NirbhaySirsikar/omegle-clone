
import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
  name: string;
  socket: Socket;
}

export class UserManager {
  private users: User[];
  private queue: string[];
  private roomManager: RoomManager;

  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }

  addUser(name: string, socket: Socket) {
    this.users.push({ name, socket });
    this.queue.push(socket.id);
    socket.send("lobby");
    this.clearQueue();
    this.initHandlers(socket);
  }

  removeUser(socketId: string) {
    const user = this.users.find(x => x.socket.id === socketId);
    this.users = this.users.filter(x => x.socket.id !== socketId);
    this.queue = this.queue.filter(x => x === socketId);
  }

  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }
    const user1_socketId = this.queue.pop();
    const user2_socketId = this.queue.pop();
    const user1 = this.users.find(x => x.socket.id === user1_socketId);
    const user2 = this.users.find(x => x.socket.id === user2_socketId);
    if (!user1 || !user2) {
      return;
    }
    const room = this.roomManager.createRoom(user1, user2);
    this.clearQueue();
  }

  initHandlers(socket: Socket) {
    socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
      this.roomManager.onOffer(roomId, sdp, socket.id);
    });

    socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
      this.roomManager.onAnswer(roomId, sdp, socket.id);
    });

    socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
      this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
    })
  }
}
