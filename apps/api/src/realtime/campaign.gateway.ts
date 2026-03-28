import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SOCKET_EVENTS } from './socket-events';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CampaignGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CampaignGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`client connected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`client disconnected ${client.id}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_CAMPAIGN)
  handleJoin(client: Socket, payload: { campaignId: string }) {
    const room = `campaign:${payload.campaignId}`;
    void client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_CAMPAIGN)
  handleLeave(client: Socket, payload: { campaignId: string }) {
    const room = `campaign:${payload.campaignId}`;
    void client.leave(room);
    return { ok: true };
  }

  emitCampaignProgress(campaignId: string, payload: Record<string, unknown>) {
    this.server.to(`campaign:${campaignId}`).emit(SOCKET_EVENTS.CAMPAIGN_PROGRESS_UPDATED, payload);
  }

  emitNewSupport(campaignId: string, payload: Record<string, unknown>) {
    this.server.to(`campaign:${campaignId}`).emit(SOCKET_EVENTS.NEW_SUPPORT_EVENT, payload);
  }

  emitLeaderboard(campaignId: string, payload: Record<string, unknown>) {
    this.server.to(`campaign:${campaignId}`).emit(SOCKET_EVENTS.LEADERBOARD_UPDATED, payload);
  }
}
