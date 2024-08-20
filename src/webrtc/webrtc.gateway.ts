import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebrtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Set<Socket>>(); // 방과 해당 방의 클라이언트를 저장하는 Map

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
    this.removeClientFromRooms(client);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set<Socket>());
    }

    this.rooms.get(roomId).add(client);
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);

    // Notify other clients in the room
    client.broadcast.to(roomId).emit('client-joined', { id: client.id });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket): void {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(client);
      client.leave(roomId);
      console.log(`Client ${client.id} left room ${roomId}`);

      // Notify other clients in the room
      client.broadcast.to(roomId).emit('client-left', { id: client.id });
    }
  }

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() offer: any, @ConnectedSocket() client: Socket): void {
    const roomId = this.getClientRoom(client);
    if (roomId) {
      client.broadcast.to(roomId).emit('offer', offer);
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() answer: any, @ConnectedSocket() client: Socket): void {
    const roomId = this.getClientRoom(client);
    if (roomId) {
      client.broadcast.to(roomId).emit('answer', answer);
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(@MessageBody() candidate: any, @ConnectedSocket() client: Socket): void {
    const roomId = this.getClientRoom(client);
    if (roomId) {
      client.broadcast.to(roomId).emit('ice-candidate', candidate);
    }
  }

  private getClientRoom(client: Socket): string | undefined {
    for (const [roomId, clients] of this.rooms.entries()) {
      if (clients.has(client)) {
        return roomId;
      }
    }
    return undefined;
  }

  private removeClientFromRooms(client: Socket): void {
    for (const [roomId, clients] of this.rooms.entries()) {
      if (clients.has(client)) {
        clients.delete(client);
        client.leave(roomId);
        this.server.to(roomId).emit('client-left', { id: client.id });
      }
    }
  }
}
