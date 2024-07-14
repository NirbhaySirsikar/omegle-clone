import { Socket } from "socket.io";

let GLOBAL_ROOM_ID = 1;

interface Room {
  user1: Socket;
  user2: Socket;
}

export class RoomManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(user1: Socket, user2: Socket) {
    const roomId: string = this.generate();
    this.rooms.set(roomId.toString(), { user1, user2 });
    user1.emit("send-offer", { roomId });
    // user2.emit("send-offer", { roomId });
  }

  //TODO: remove room

  onOffer(roomId: string, sdp: string, senderSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    // const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    const receivingUser = room.user2;
    receivingUser.emit("offer", { sdp, roomId });
    console.log("offer sent to receiver")
  }


  onAnswer(roomId: string, sdp: string, senderSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    // const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    const sendingUser = room.user1;
    sendingUser.emit("answer", { sdp, roomId });
  }

  onIceCandidates(roomId: string, senderSocketId: string, candidate: any) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const otherUser = room.user1.id === senderSocketId ? room.user2 : room.user1;
    otherUser.emit("add-ice-candidate", ({ candidate }));
  }


  generate() {
    return (GLOBAL_ROOM_ID++).toString();
  }
}
