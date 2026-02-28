/**
 * Roast Gallery — Best AI Burns on Scam Contracts
 * Scrolling gallery showing contract address, confidence, and the roast text.
 */

import { useSentinadStore } from '../store';
import { Flame } from 'lucide-react';

function truncAddr(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
}

export function RoastGallery() {
    const roasts = useSentinadStore((s) => s.roasts);

    return (
        <div className="bg-sentinad-bg-card rounded-lg border border-sentinad-border box-glow-purple overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-sentinad-border flex items-center gap-2">
                <Flame size={14} className="text-sentinad-orange" />
                <h2 className="text-sm font-bold text-sentinad-orange tracking-wider">
                    ROAST GALLERY
                </h2>
                {roasts.length > 0 && (
                    <span className="ml-auto text-[10px] text-sentinad-text-dim bg-sentinad-red/10 px-2 py-0.5 rounded-full">
                        {roasts.length} scams detected
                    </span>
                )}
            </div>

            {/* Roast list */}
            <div className="flex-1 overflow-y-auto terminal-scroll">
                {roasts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-sentinad-text-dim">
                        <Flame size={24} className="opacity-30" />
                        <span className="text-xs">No scams detected yet...</span>
                        <span className="text-[10px]">The Sentinad is watching.</span>
                    </div>
                ) : (
                    <div className="p-2 space-y-2">
                        {roasts.map((roast, i) => (
                            <div
                                key={`${roast.contractAddress}-${i}`}
                                className="roast-entry bg-sentinad-bg-terminal rounded-md border border-sentinad-border/50 p-3 hover:border-sentinad-red/30 transition-colors"
                            >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-sentinad-red bg-sentinad-red/10 px-1.5 py-0.5 rounded">
                                            SCAM
                                        </span>
                                        <span className="text-[11px] font-mono text-sentinad-text-dim">
                                            {truncAddr(roast.contractAddress)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-sentinad-yellow">
                                            {roast.confidence}% conf
                                        </span>
                                        <span className="text-[10px] text-sentinad-text-dim">
                                            {timeAgo(roast.timestamp)}
                                        </span>
                                    </div>
                                </div>
                                {/* Roast text */}
                                <p className="text-xs text-sentinad-orange/90 leading-relaxed italic">
                                    "{roast.roast}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
