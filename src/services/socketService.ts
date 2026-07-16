import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const SOCKET_BASE = API_BASE.replace(/\/api\/v\d+\/?$/, '');

let socket: Socket | null = null;

function connect(): Socket | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(`${SOCKET_BASE}/chat`, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

function joinConversation(conversationId: number) {
  socket?.emit('rejoindre', { conversationId });
}

function onMessage(handler: (data: any) => void) {
  socket?.on('message', handler);
}

function offMessage(handler?: (data: any) => void) {
  if (handler) socket?.off('message', handler);
  else socket?.off('message');
}

function onEvent(event: string, handler: (data: any) => void) {
  socket?.on(event, handler);
}

function offEvent(event: string, handler?: (data: any) => void) {
  if (handler) socket?.off(event, handler);
  else socket?.off(event);
}

function isConnected() {
  return socket?.connected === true;
}

function disconnect() {
  socket?.disconnect();
  socket = null;
}

export const socketService = {
  connect,
  joinConversation,
  onMessage,
  offMessage,
  onEvent,
  offEvent,
  isConnected,
  disconnect,
};
