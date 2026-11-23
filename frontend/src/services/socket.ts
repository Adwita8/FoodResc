import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || window.location.origin;

// Socket Server -> Client Event Signatures
export interface ServerToClientEvents {
  'donation:new': (data: { donationId: string; foodName: string; category: string; location: [number, number] }) => void;
  'donation:updated': (data: { donationId: string; status: string }) => void;
  'donation:claimed': (data: { donationId: string; claimedBy: string }) => void;
  'allocation:offered': (data: { allocationOfferId: string; donationId: string; expiresAt: string }) => void;
  'allocation:accepted': (data: { allocationId: string; ngoId: string }) => void;
  'pickup:assigned': (data: { pickupId: string; volunteerId: string }) => void;
  'pickup:status_change': (data: { pickupId: string; status: string; timestamp: string }) => void;
  'pickup:location_update': (data: { pickupId: string; latitude: number; longitude: number; heading?: number }) => void;
  'notification:new': (data: { id: string; title: string; message: string; type: string }) => void;
  'emergency:alert': (data: { requestId: string; title: string; urgency: string }) => void;
}

// Socket Client -> Server Event Signatures
export interface ClientToServerEvents {
  'join:user': (userId: string) => void;
  'leave:user': (userId: string) => void;
  'join:pickup': (pickupId: string) => void;
  'leave:pickup': (pickupId: string) => void;
  'volunteer:location_update': (data: { pickupId: string; latitude: number; longitude: number }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: AppSocket | null = null;

/**
 * Initializes and returns the global Socket.IO connection.
 * Automatically attaches JWT authentication token from localStorage.
 */
export function initializeSocket(): AppSocket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const token = localStorage.getItem('accessToken');

  socketInstance = io(SOCKET_URL, {
    path: '/socket.io',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    auth: {
      token: token ? `Bearer ${token}` : undefined,
    },
  });

  socketInstance.on('connect', () => {
    // Reconnection or connection success
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection warning:', err.message);
  });

  socketInstance.on('disconnect', (_reason) => {
    // disconnected
  });

  return socketInstance;
}

/**
 * Get active socket instance or create one if not yet initialized.
 */
export function getSocket(): AppSocket {
  if (!socketInstance) {
    return initializeSocket();
  }
  return socketInstance;
}

/**
 * Disconnect and destroy active socket instance.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
