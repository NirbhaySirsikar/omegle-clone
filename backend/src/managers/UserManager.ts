
import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
  name: string;
  socket: Socket;
}

export class UserManager {
  private users: Socket[];
  private queue: string[];
  private roomManager: RoomManager;

  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomManager();
  }

  addUser(socket: Socket) {
    this.users.push(socket);
    this.queue.push(socket.id);
    socket.send("lobby");
    this.clearQueue();
    this.initHandlers(socket);
  }

  removeUser(socketId: string) {
    const user = this.users.find(x => x.id === socketId);
    this.users = this.users.filter(x => x.id !== socketId);
    this.queue = this.queue.filter(x => x !== socketId);
  }

  addNextUser(user1: Socket, user2: Socket) {
    this.queue.push(user1.id);
    this.queue.push(user2.id);
    this.clearQueue();
  }

  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }
    const user1_socketId = this.queue.pop();
    const user2_socketId = this.queue.pop();
    const user1 = this.users.find(x => x.id === user1_socketId);
    const user2 = this.users.find(x => x.id === user2_socketId);
    if (!user1 || !user2) {
      return;
    }
    const room = this.roomManager.createRoom(user1, user2);
    this.clearQueue();
  }

  initHandlers(socket: Socket) {
    socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
      console.log("offer received");
      this.roomManager.onOffer(roomId, sdp, socket.id);
    });

    socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
      this.roomManager.onAnswer(roomId, sdp, socket.id);
      console.log("answer received");
    });

    socket.on("add-ice-candidate", ({ candidate, roomId }) => {
      console.log("add-ice-candidate received");
      this.roomManager.onIceCandidates(roomId, socket.id, candidate);
    })

    // socket.on("next-user", ({ roomId }) => {
    //   console.log('next user');
    //   this.roomManager.onNextUser(socket.id, roomId);
    //   console.log("next-user");
    //
    // })
  }
}
