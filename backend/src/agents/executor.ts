/**
 * Executor Agent — "The Striker"
 * 
 * Only activates when Vibe Agent says safe: true.
 * Simulates a flash arbitrage transaction with realistic timing.
 * In production, this would build and submit real transactions via Arbiter.sol.
 */

import { EventEmitter } from "events";
import { EXECUTOR_CONFIG } from "../config/prompts";
import { ethers } from "ethers";

export interface TradeResult {
    txHash: string;
    pair: string;
    buyDex: string;
    sellDex: string;
    amountIn: number;
    amountOut: number;
    profit: number;
    gasCost: number;
    netProfit: number;
    executionTimeMs: number;
    timestamp: number;
}

export class ExecutorAgent extends EventEmitter {
    private totalProfit = 0;
    private tradeCount = 0;

    constructor() {
        super();
    }

    /**
     * Execute a flash arbitrage trade (simulated for demo)
     */
    async execute(opportunity: {
        pair: string;
        buyDex: string;
        sellDex: string;
        profitPercent: number;
        estimatedProfit: number;
    }): Promise<TradeResult> {
        const startTime = Date.now();

        this.emit("log", {
            agent: "Executor",
            message: `Constructing flash loan transaction...`,
            type: "execution",
        });

        // Simulate building the transaction
        await this.delay(200 + Math.random() * 300);

        this.emit("log", {
            agent: "Executor",
            message: `Flash borrowing 1000 MON from ${opportunity.buyDex}...`,
            type: "execution",
        });

        // Simulate the swap execution  
        const executionDelay = EXECUTOR_CONFIG.minDelayMs +
            Math.random() * (EXECUTOR_CONFIG.maxDelayMs - EXECUTOR_CONFIG.minDelayMs);
        await this.delay(executionDelay);

        this.emit("log", {
            agent: "Executor",
            message: `Swapping MON → USDC on ${opportunity.buyDex} (buy low)...`,
            type: "execution",
        });

        await this.delay(150 + Math.random() * 200);

        this.emit("log", {
            agent: "Executor",
            message: `Swapping USDC → MON on ${opportunity.sellDex} (sell high)...`,
            type: "execution",
        });

        await this.delay(150 + Math.random() * 200);

        // Generate realistic trade result
        const amountIn = 1000;
        const profitRaw = +(amountIn * opportunity.profitPercent / 100).toFixed(2);
        const gasCost = +(EXECUTOR_CONFIG.estimatedGasCost * (0.8 + Math.random() * 0.4)).toFixed(4);
        const netProfit = +(profitRaw - gasCost).toFixed(2);
        const executionTimeMs = Date.now() - startTime;

        // Generate a realistic-looking tx hash
        const txHash = "0x" + ethers.hexlify(ethers.randomBytes(32)).slice(2);

        this.totalProfit += netProfit;
        this.tradeCount++;

        const result: TradeResult = {
            txHash,
            pair: opportunity.pair,
            buyDex: opportunity.buyDex,
            sellDex: opportunity.sellDex,
            amountIn,
            amountOut: +(amountIn + profitRaw).toFixed(2),
            profit: profitRaw,
            gasCost,
            netProfit,
            executionTimeMs,
            timestamp: Date.now(),
        };

        this.emit("log", {
            agent: "Executor",
            message: `Repaying flash loan... Transaction confirmed!`,
            type: "execution",
        });

        return result;
    }

    getTotalProfit(): number {
        return +this.totalProfit.toFixed(2);
    }

    getTradeCount(): number {
        return this.tradeCount;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
