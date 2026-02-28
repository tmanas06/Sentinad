/**
 * Vibe Agent — "The Auditor"
 * 
 * AI-powered smart contract security agent.
 * Uses Groq (Llama 3.3 70B) to analyze contract code for honeypots and rug pulls.
 * Caches results to avoid redundant API calls.
 * Produces roasts in Monad slang for scam contracts.
 */

import { EventEmitter } from "events";
import OpenAI from "openai";
import { VIBE_SYSTEM_PROMPT, CONTRACT_SOURCES } from "../config/prompts";

// Groq is OpenAI-compatible — we use the OpenAI SDK with Groq's base URL
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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
    private groq: OpenAI;
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTTL = 60 * 60 * 1000; // 1 hour

    constructor() {
        super();
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey === "your_groq_api_key_here") {
            throw new Error("GROQ_API_KEY is required in .env");
        }

        this.groq = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });

        this.emit("log", {
            agent: "Vibe",
            message: "AI auditor online. Groq LLM (Llama 3.3 70B) connected.",
            type: "system",
        });
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

        const contractCode = this.getContractCode(contractAddress);

        this.emit("log", {
            agent: "Vibe",
            message: `Running AI security audit on ${this.truncAddr(contractAddress)}...`,
            type: "audit",
        });

        const startTime = Date.now();
        const result = await this.callGroq(contractAddress, contractCode, startTime);

        // Cache the result
        this.cache.set(contractAddress, {
            result,
            expiry: Date.now() + this.cacheTTL,
        });

        return result;
    }

    /**
     * Call Groq API for contract audit
     */
    private async callGroq(
        contractAddress: string,
        contractCode: string,
        startTime: number
    ): Promise<VibeResult> {
        try {
            const response = await this.groq.chat.completions.create({
                model: GROQ_MODEL,
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
                message: `Groq API error: ${error.message}`,
                type: "error",
            });

            // Return a cautious "unsafe" verdict on API failure
            return {
                contractAddress,
                safe: false,
                confidence: 0,
                threats: ["API error — unable to audit"],
                roast: `The Sentinad couldn't reach Groq to audit ${this.truncAddr(contractAddress)}. Playing it safe — hard pass until we can verify.`,
                cached: false,
                auditTimeMs: Date.now() - startTime,
                timestamp: Date.now(),
            };
        }
    }

    private getContractCode(address: string): string {
        return CONTRACT_SOURCES[address] || `// Contract source not available for ${address}\n// Using bytecode analysis fallback`;
    }

    private truncAddr(addr: string): string {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
}
