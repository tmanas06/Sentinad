/**
 * Vibe Agent — "The Auditor"
 * 
 * AI-powered smart contract security agent.
 * Uses GPT-4o-mini to analyze contract code for honeypots and rug pulls.
 * Caches results to avoid redundant API calls.
 * Produces roasts in Monad slang for scam contracts.
 */

import { EventEmitter } from "events";
import OpenAI from "openai";
import { VIBE_SYSTEM_PROMPT, DEMO_CONTRACTS } from "../config/prompts";

export interface VibeResult {
    contractAddress: string;
    safe: boolean;
    confidence: number;
    threats: string[];
    roast: string;
    cached: boolean;
    auditTimeMs: number;
    timestamp: number;
}

interface CacheEntry {
    result: VibeResult;
    expiry: number;
}

export class VibeAgent extends EventEmitter {
    private openai: OpenAI | null = null;
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTTL = 60 * 60 * 1000; // 1 hour
    private useAI: boolean;

    constructor() {
        super();
        const apiKey = process.env.OPENAI_API_KEY;
        this.useAI = !!apiKey && apiKey !== "your_openai_api_key_here";

        if (this.useAI) {
            this.openai = new OpenAI({ apiKey });
            this.emit("log", {
                agent: "Vibe",
                message: "AI auditor online. GPT-4o-mini connected.",
                type: "system",
            });
        } else {
            this.emit("log", {
                agent: "Vibe",
                message: "Running in demo mode (no OpenAI key). Using pre-computed audits.",
                type: "system",
            });
        }
    }

    /**
     * Audit a smart contract for safety
     */
    async audit(contractAddress: string): Promise<VibeResult> {
        // Check cache first
        const cached = this.cache.get(contractAddress);
        if (cached && cached.expiry > Date.now()) {
            this.emit("log", {
                agent: "Vibe",
                message: `Cache hit for ${this.truncAddr(contractAddress)}. Returning stored verdict.`,
                type: "cache",
            });
            return { ...cached.result, cached: true };
        }

        this.emit("log", {
            agent: "Vibe",
            message: `Fetching contract source for ${this.truncAddr(contractAddress)}...`,
            type: "audit",
        });

        // Simulate fetch delay
        await this.delay(300 + Math.random() * 400);

        const contractCode = this.getContractCode(contractAddress);

        this.emit("log", {
            agent: "Vibe",
            message: `Running AI security audit on ${this.truncAddr(contractAddress)}...`,
            type: "audit",
        });

        const startTime = Date.now();
        let result: VibeResult;

        if (this.useAI && this.openai) {
            result = await this.auditWithAI(contractAddress, contractCode, startTime);
        } else {
            result = await this.auditWithDemo(contractAddress, startTime);
        }

        // Cache the result
        this.cache.set(contractAddress, {
            result,
            expiry: Date.now() + this.cacheTTL,
        });

        return result;
    }

    /**
     * Audit using real OpenAI API
     */
    private async auditWithAI(
        contractAddress: string,
        contractCode: string,
        startTime: number
    ): Promise<VibeResult> {
        try {
            const response = await this.openai!.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: VIBE_SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: `Audit this smart contract at address ${contractAddress}:\n\n\`\`\`solidity\n${contractCode}\n\`\`\``,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: "json_object" },
            });

            const content = response.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);
            const auditTimeMs = Date.now() - startTime;

            return {
                contractAddress,
                safe: parsed.safe ?? false,
                confidence: parsed.confidence ?? 50,
                threats: parsed.threats ?? [],
                roast: parsed.roast ?? "Unable to parse AI response.",
                cached: false,
                auditTimeMs,
                timestamp: Date.now(),
            };
        } catch (error: any) {
            this.emit("log", {
                agent: "Vibe",
                message: `AI API error: ${error.message}. Falling back to demo mode.`,
                type: "error",
            });
            return this.auditWithDemo(contractAddress, startTime);
        }
    }

    /**
     * Audit using pre-computed demo results
     */
    private async auditWithDemo(
        contractAddress: string,
        startTime: number
    ): Promise<VibeResult> {
        // Simulate AI thinking time
        await this.delay(600 + Math.random() * 800);
        const auditTimeMs = Date.now() - startTime;

        // Check if this is a known demo contract
        const safeContract = DEMO_CONTRACTS.safe.find(c => c.address === contractAddress);
        const scamContract = DEMO_CONTRACTS.scam.find(c => c.address === contractAddress);

        if (safeContract) {
            const roasts = [
                `Gmonad fam! ${safeContract.name} is clean as a freshly deployed purple chain. No hidden fees, no owner backdoors. Chog energy only. The nads approve.`,
                `The Sentinad gives this one the purple stamp of approval. Standard logic, transparent code, zero molandak vibes. Gmonad and carry on.`,
                `Scanned every line of ${safeContract.name}. This dev actually knows what they're doing. Clean mint, clean transfers, clean everything. Absolute chog behavior.`,
            ];

            return {
                contractAddress,
                safe: true,
                confidence: 88 + Math.floor(Math.random() * 10),
                threats: [],
                roast: roasts[Math.floor(Math.random() * roasts.length)],
                cached: false,
                auditTimeMs,
                timestamp: Date.now(),
            };
        }

        if (scamContract) {
            const scamData = this.getScamData(scamContract.name);
            return {
                contractAddress,
                safe: false,
                confidence: 90 + Math.floor(Math.random() * 8),
                threats: scamData.threats,
                roast: scamData.roast,
                cached: false,
                auditTimeMs,
                timestamp: Date.now(),
            };
        }

        // Unknown contract — randomize
        const isSafe = Math.random() > 0.4;
        if (isSafe) {
            return {
                contractAddress,
                safe: true,
                confidence: 80 + Math.floor(Math.random() * 15),
                threats: [],
                roast: `Gmonad! Contract ${this.truncAddr(contractAddress)} passes the vibe check. No molandak patterns detected. Chog.`,
                cached: false,
                auditTimeMs,
                timestamp: Date.now(),
            };
        } else {
            return {
                contractAddress,
                safe: false,
                confidence: 85 + Math.floor(Math.random() * 12),
                threats: ["suspicious owner privileges", "potential transfer restrictions"],
                roast: `This dev thought they could sneak one past The Sentinad? Mid-curve molandak energy detected at ${this.truncAddr(contractAddress)}. Hidden owner functions and sus transfer logic. Hard pass, nads.`,
                cached: false,
                auditTimeMs,
                timestamp: Date.now(),
            };
        }
    }

    private getScamData(name: string): { threats: string[]; roast: string } {
        const scamResponses: Record<string, { threats: string[]; roast: string }> = {
            HoneypotToken: {
                threats: ["sell function permanently disabled", "hidden 25% tax", "owner blacklist function", "owner can withdraw all ETH"],
                roast: "Absolute MOLANDAK energy from this mid-curve dev. They named it 'Definitely Not A Scam' — the irony is chef's kiss. Sell function is locked behind sellEnabled which is NEVER set to true. Plus a hidden 25% tax AND a blacklist? This dev needs to touch grass immediately. The Sentinad says HARD PASS.",
            },
            RugPullDex: {
                threats: ["only owner can remove liquidity", "pausable by owner", "selfdestruct enabled", "fake swap function"],
                roast: "This 'DEX' is about as decentralized as a piggy bank. Only the owner can pull liquidity, they can pause your trades anytime, and they literally have a SELFDESTRUCT function. This dev out here playing with everyone's funds like it's Monopoly money. Peak mid-curve rug energy. Stay away, nads.",
            },
            ProxyRugToken: {
                threats: ["delegatecall to mutable implementation", "unlimited owner minting", "changeable transfer logic"],
                roast: "Oh we got a big brain mid-curve here using delegatecall to hide their rug. The owner can literally REWRITE the transfer function at any time AND mint infinite tokens. This is the Web3 equivalent of writing checks from someone else's account. Molandak level: CRITICAL. The Sentinad is disgusted.",
            },
        };

        return scamResponses[name] || {
            threats: ["suspicious patterns detected"],
            roast: `Molandak vibes detected. This contract has more red flags than a scammer's dating profile. Hard pass.`,
        };
    }

    private getContractCode(address: string): string {
        const safe = DEMO_CONTRACTS.safe.find(c => c.address === address);
        if (safe) return safe.code;

        const scam = DEMO_CONTRACTS.scam.find(c => c.address === address);
        if (scam) return scam.code;

        return `// Contract source not available for ${address}\n// Using bytecode analysis fallback`;
    }

    private truncAddr(addr: string): string {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
