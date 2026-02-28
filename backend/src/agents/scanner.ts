/**
 * Scanner Agent — "The Hunter"
 * 
 * Monitors price differences across two DEXs every few seconds.
 * Emits 'opportunity' events when a profitable gap is detected.
 * 
 * For demo: uses simulated price feeds that generate realistic
 * price movements with periodic arbitrage opportunities.
 */

import { EventEmitter } from "events";
import { SCANNER_CONFIG } from "../config/prompts";

export interface PriceData {
    pair: string;
    dexA: string;
    dexB: string;
    priceA: number;
    priceB: number;
    spread: number;
    timestamp: number;
}

export interface Opportunity {
    id: string;
    pair: string;
    buyDex: string;
    sellDex: string;
    buyPrice: number;
    sellPrice: number;
    profitPercent: number;
    estimatedProfit: number;
    contractAddress: string;
    timestamp: number;
}

export class ScannerAgent extends EventEmitter {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private scanCount = 0;
    private basePriceA = 1.0;
    private basePriceB = 1.02;
    private running = false;

    constructor() {
        super();
    }

    /**
     * Start the price scanning loop
     */
    start(): void {
        if (this.running) return;
        this.running = true;

        this.emit("log", {
            agent: "Scanner",
            message: "Initializing price monitors on Kuru DEX and MockDex...",
            type: "system",
        });

        setTimeout(() => {
            this.emit("log", {
                agent: "Scanner",
                message: "Connected to Monad Testnet RPC. Monitoring MON/USDC pair.",
                type: "system",
            });

            this.intervalId = setInterval(() => {
                this.scan();
            }, SCANNER_CONFIG.pollInterval);
        }, 1500);
    }

    /**
     * Stop the scanning loop
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
        this.emit("log", {
            agent: "Scanner",
            message: "Scanner stopped.",
            type: "system",
        });
    }

    /**
     * Execute a single price scan
     */
    private scan(): void {
        this.scanCount++;
        const pair = SCANNER_CONFIG.pairs[0];

        // Simulate realistic price movements
        const noise1 = (Math.random() - 0.5) * 0.04;
        const noise2 = (Math.random() - 0.5) * 0.04;

        // Every ~8 scans, create a real arb opportunity (larger price gap)
        const isOpportunity = this.scanCount % 8 === 0;
        const arbBoost = isOpportunity ? 0.02 + Math.random() * 0.03 : 0;

        const priceA = +(this.basePriceA + noise1).toFixed(4);
        const priceB = +(this.basePriceA + noise2 + arbBoost).toFixed(4);
        const spread = +((priceB - priceA) / priceA * 100).toFixed(2);

        const priceData: PriceData = {
            pair: pair.name,
            dexA: pair.dexA,
            dexB: pair.dexB,
            priceA,
            priceB,
            spread,
            timestamp: Date.now(),
        };

        this.emit("price-update", priceData);

        if (spread > SCANNER_CONFIG.profitThreshold) {
            const contractAddresses = [
                "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
                "0xDEAD000000000000000000000000000000001337",
                "0x8B3a08B22F23f37FA4e2E0E5a0F147F4829E2c3A",
                "0xBAD0000000000000000000000000000000000069",
                "0xFAKE00000000000000000000000000000000DEAD",
            ];
            const randomContract = contractAddresses[Math.floor(Math.random() * contractAddresses.length)];

            const opportunity: Opportunity = {
                id: `opp-${this.scanCount}-${Date.now()}`,
                pair: pair.name,
                buyDex: priceA < priceB ? pair.dexA : pair.dexB,
                sellDex: priceA < priceB ? pair.dexB : pair.dexA,
                buyPrice: Math.min(priceA, priceB),
                sellPrice: Math.max(priceA, priceB),
                profitPercent: Math.abs(spread),
                estimatedProfit: +(Math.abs(spread) * 0.75).toFixed(2), // after fees
                contractAddress: randomContract,
                timestamp: Date.now(),
            };

            this.emit("log", {
                agent: "Scanner",
                message: `Price gap detected: ${pair.name} — ${Math.abs(spread)}% arb available (${opportunity.buyDex} → ${opportunity.sellDex})`,
                type: "opportunity",
            });

            this.emit("opportunity", opportunity);
        } else {
            // Only log every few scans to avoid flooding
            if (this.scanCount % 3 === 0) {
                this.emit("log", {
                    agent: "Scanner",
                    message: `Scanning ${pair.name}... ${pair.dexA}: $${priceA} | ${pair.dexB}: $${priceB} | Spread: ${spread}%`,
                    type: "scan",
                });
            }
        }
    }

    getScanCount(): number {
        return this.scanCount;
    }
}
