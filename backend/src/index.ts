/**
 * The Sentinad — Backend Entry Point
 * 
 * Express server + Socket.io + Orchestrator wiring.
 * Starts all agents and begins the scanning loop.
 */

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "./websocket";
import { Orchestrator } from "./orchestrator";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const ws = new WebSocketServer(httpServer);

// Initialize Orchestrator
const orchestrator = new Orchestrator(ws);

// --- REST API Routes ---

app.get("/health", (_req, res) => {
    res.json({
        status: "online",
        agent: "The Sentinad",
        timestamp: Date.now(),
    });
});

app.get("/api/stats", (_req, res) => {
    res.json(orchestrator.getStats());
});

app.get("/api/roasts", (_req, res) => {
    res.json(orchestrator.getRoasts());
});

// --- Start ---
httpServer.listen(PORT, () => {
    console.log("");
    console.log("  ╔══════════════════════════════════════════╗");
    console.log("  ║        THE SENTINAD — ONLINE             ║");
    console.log("  ║   AI-Powered Arbitrage Bot on Monad      ║");
    console.log("  ╠══════════════════════════════════════════╣");
    console.log(`  ║   Server:    http://localhost:${PORT}        ║`);
    console.log("  ║   WebSocket: Connected                   ║");
    console.log("  ║   Network:   Monad Testnet               ║");
    console.log("  ╚══════════════════════════════════════════╝");
    console.log("");

    // Start the orchestrator (which starts all agents)
    orchestrator.start();
});
