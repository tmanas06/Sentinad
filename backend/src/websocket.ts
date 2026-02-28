/**
 * WebSocket Server — Real-time Event Broadcasting
 * 
 * Uses socket.io to push agent events to all connected frontend clients.
 * Events: log, stats-update, roast, trade-complete, state-change
 */

import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export class WebSocketServer {
    private io: Server;
    private connectedClients = 0;

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        this.io.on("connection", (socket: Socket) => {
            this.connectedClients++;
            console.log(`[WebSocket] Client connected (${this.connectedClients} total)`);

            socket.on("disconnect", () => {
                this.connectedClients--;
                console.log(`[WebSocket] Client disconnected (${this.connectedClients} total)`);
            });
        });
    }

    /**
     * Broadcast an event to all connected clients
     */
    broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }

    /**
     * Get the current number of connected clients
     */
    getClientCount(): number {
        return this.connectedClients;
    }

    /**
     * Get the underlying socket.io server
     */
    getIO(): Server {
        return this.io;
    }
}
