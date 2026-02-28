/**
 * Orchestrator — "The Brain"
 * 
 * Coordinates all agents using a state machine:
 *   IDLE → SCANNING → AUDITING → EXECUTING/ROASTING → SUCCESS/IDLE
 * 
 * Maintains global stats, pushes events to WebSocket clients, and
 * ensures only one pipeline runs at a time.
 */

import { ScannerAgent, Opportunity } from "./agents/scanner";
import { VibeAgent, VibeResult } from "./agents/vibe";
import { ExecutorAgent, TradeResult } from "./agents/executor";
import { WebSocketServer } from "./websocket";

export type SystemState = "IDLE" | "SCANNING" | "AUDITING" | "EXECUTING" | "ROASTING" | "SUCCESS";

export interface Stats {
    scansRun: number;
    scamsDodged: number;
    tradesExecuted: number;
    totalProfit: number;
    uptime: number;
    state: SystemState;
}

export class Orchestrator {
    private scanner: ScannerAgent;
    private vibeAgent: VibeAgent;
    private executor: ExecutorAgent;
    private ws: WebSocketServer;

    private state: SystemState = "IDLE";
    private stats: Stats = {
        scansRun: 0,
        scamsDodged: 0,
        tradesExecuted: 0,
        totalProfit: 0,
        uptime: 0,
        state: "IDLE",
    };
    private startTime: number = Date.now();
    private processing = false;
    private roasts: Array<{ contractAddress: string; roast: string; confidence: number; timestamp: number }> = [];

    constructor(ws: WebSocketServer) {
        this.ws = ws;
        this.scanner = new ScannerAgent();
        this.vibeAgent = new VibeAgent();
        this.executor = new ExecutorAgent();

        this.wireEvents();
    }

    /**
     * Wire up all agent event listeners
     */
    private wireEvents(): void {
        // --- Scanner events ---
        this.scanner.on("log", (data) => this.broadcastLog(data));

        this.scanner.on("price-update", (data) => {
            this.stats.scansRun++;
            this.ws.broadcast("price-update", data);
        });

        this.scanner.on("opportunity", async (opp: Opportunity) => {
            if (this.processing) {
                this.broadcastLog({
                    agent: "Orchestrator",
                    message: "Pipeline busy — skipping opportunity.",
                    type: "system",
                });
                return;
            }
            await this.handleOpportunity(opp);
        });

        // --- Vibe Agent events ---
        this.vibeAgent.on("log", (data) => this.broadcastLog(data));

        // --- Executor events ---
        this.executor.on("log", (data) => this.broadcastLog(data));
    }

    /**
     * Handle a detected arbitrage opportunity
     */
    private async handleOpportunity(opp: Opportunity): Promise<void> {
        this.processing = true;

        try {
            // State: AUDITING
            this.setState("AUDITING");
            this.broadcastLog({
                agent: "Orchestrator",
                message: `Opportunity received! ${opp.pair} — ${opp.profitPercent}% gap. Initiating vibe check...`,
                type: "state",
            });

            // Run the vibe check
            const verdict: VibeResult = await this.vibeAgent.audit(opp.contractAddress);

            if (verdict.safe) {
                // --- SAFE: Execute trade ---
                this.broadcastLog({
                    agent: "Vibe",
                    message: `SAFE — Confidence: ${verdict.confidence}% — ${verdict.roast}`,
                    type: "safe",
                });

                this.ws.broadcast("verdict", { ...verdict, opportunity: opp });

                // State: EXECUTING
                this.setState("EXECUTING");
                this.broadcastLog({
                    agent: "Orchestrator",
                    message: "Vibe check passed. Deploying Executor Agent...",
                    type: "state",
                });

                const tradeResult: TradeResult = await this.executor.execute(opp);

                // State: SUCCESS
                this.setState("SUCCESS");
                this.stats.tradesExecuted++;
                this.stats.totalProfit = this.executor.getTotalProfit();

                this.broadcastLog({
                    agent: "System",
                    message: `SUCCESS: Printed ${tradeResult.netProfit} MON in ${(tradeResult.executionTimeMs / 1000).toFixed(1)}s | TX: ${tradeResult.txHash.slice(0, 14)}...`,
                    type: "success",
                });

                this.ws.broadcast("trade-complete", tradeResult);
            } else {
                // --- SCAM: Log roast ---
                this.setState("ROASTING");
                this.stats.scamsDodged++;

                this.broadcastLog({
                    agent: "Vibe",
                    message: `SCAM DETECTED — Confidence: ${verdict.confidence}% — Threats: ${verdict.threats.join(", ")}`,
                    type: "scam",
                });

                this.broadcastLog({
                    agent: "Vibe",
                    message: verdict.roast,
                    type: "roast",
                });

                const roastEntry = {
                    contractAddress: opp.contractAddress,
                    roast: verdict.roast,
                    confidence: verdict.confidence,
                    timestamp: Date.now(),
                };
                this.roasts.push(roastEntry);
                this.ws.broadcast("roast", roastEntry);
            }

            // Broadcast updated stats
            this.broadcastStats();

            // Brief pause before returning to IDLE
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.setState("IDLE");
        } catch (error: any) {
            this.broadcastLog({
                agent: "Orchestrator",
                message: `Pipeline error: ${error.message}`,
                type: "error",
            });
            this.setState("IDLE");
        } finally {
            this.processing = false;
        }
    }

    /**
     * Start all agents
     */
    start(): void {
        this.startTime = Date.now();
        this.broadcastLog({
            agent: "Orchestrator",
            message: "The Sentinad is online. All agents initialized.",
            type: "system",
        });
        this.broadcastLog({
            agent: "Orchestrator",
            message: "State machine: IDLE → Waiting for price gaps...",
            type: "system",
        });
        this.scanner.start();

        // Periodically broadcast stats
        setInterval(() => {
            this.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
            this.broadcastStats();
        }, 5000);
    }

    /**
     * Stop all agents
     */
    stop(): void {
        this.scanner.stop();
        this.setState("IDLE");
        this.broadcastLog({
            agent: "Orchestrator",
            message: "The Sentinad is shutting down. All agents stopped.",
            type: "system",
        });
    }

    private setState(newState: SystemState): void {
        this.state = newState;
        this.stats.state = newState;
        this.ws.broadcast("state-change", { state: newState });
    }

    private broadcastLog(data: { agent: string; message: string; type: string }): void {
        const logEntry = {
            ...data,
            timestamp: Date.now(),
        };
        console.log(`[${data.agent}] ${data.message}`);
        this.ws.broadcast("log", logEntry);
    }

    private broadcastStats(): void {
        this.ws.broadcast("stats-update", this.stats);
    }

    getStats(): Stats {
        return { ...this.stats };
    }

    getRoasts(): typeof this.roasts {
        return [...this.roasts];
    }
}
