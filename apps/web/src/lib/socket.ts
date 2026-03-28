import { io, type Socket } from 'socket.io-client';

const url = () =>
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export function createCampaignSocket(): Socket {
  return io(url(), {
    transports: ['websocket'],
    autoConnect: true,
  });
}
