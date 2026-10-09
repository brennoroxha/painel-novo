import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function initializeSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.VITE_API_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-campaign', (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`Client joined campaign: ${campaignId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastCampaignCreated(io: SocketServer, campaignId: string, data: any) {
  io.emit('campaign:created', { campaignId, ...data });
}

export function broadcastStatsUpdated(io: SocketServer, campaignId: string, stats: any) {
  io.to(`campaign:${campaignId}`).emit('campaign:stats:updated', stats);
}

export function broadcastDomainAdded(io: SocketServer, campaignId: string, domain: any) {
  io.to(`campaign:${campaignId}`).emit('domain:added', domain);
}

export function broadcastFase3Verdict(io: SocketServer, campaignId: string, verdict: any) {
  io.to(`campaign:${campaignId}`).emit('fase3:verdict_received', verdict);
}
