import { WebSocket } from "ws";

// WebSocket clients
export const clients = new Set<WebSocket>();

export function broadcastStateUpdate(type: string, payload?: any) {
  const message = JSON.stringify({ type, payload });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
