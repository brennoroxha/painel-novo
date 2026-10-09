import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  const joinCampaign = useCallback((campaignId: string) => {
    socket.emit('join-campaign', campaignId);
  }, [socket]);

  const on = useCallback((event: string, callback: Function) => {
    socket.on(event, callback);
  }, [socket]);

  const off = useCallback((event: string, callback?: Function) => {
    if (callback) socket.off(event, callback as any);
    else socket.off(event);
  }, [socket]);

  return { socket, joinCampaign, on, off };
}
