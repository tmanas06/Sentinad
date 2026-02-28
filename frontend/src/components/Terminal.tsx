/**
 * Terminal Component — Live Thought Stream
 * Auto-scrolling log of agent messages with color-coded entries.
 */

import { useEffect, useRef } from 'react';
import { useSentinadStore } from '../store';
import type { LogEntry } from '../store';

const AGENT_COLORS: Record<string, string> = {
    Scanner: 'text-sentinad-cyan glow-cyan',
    Vibe: 'text-sentinad-yellow glow-yellow',
    Executor: 'text-sentinad-green glow-green',
    Orchestrator: 'text-sentinad-purple-light glow-purple',
    System: 'text-sentinad-purple glow-purple',
};

const TYPE_PREFIXES: Record<string, string> = {
    success: '✓',
    scam: '✗',
    roast: '🔥',
    error: '⚠',
    opportunity: '◆',
    system: '→',
    scan: '·',
    audit: '⟐',
    execution: '⚡',
    safe: '✓',
    cache: '↺',
    state: '◈',
};

function getTimeStr(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function LogLine({ entry }: { entry: LogEntry }) {
    const colorClass = AGENT_COLORS[entry.agent] || 'text-sentinad-text-dim';
    const prefix = TYPE_PREFIXES[entry.type] || '·';
    const isHighlight = ['success', 'scam', 'roast', 'opportunity'].includes(entry.type);

    return (
        <div className={`flex gap-2 py-0.5 px-2 text-[13px] leading-relaxed ${isHighlight ? 'bg-white/[0.02]' : ''}`}>
            <span className="text-sentinad-text-dim shrink-0 w-[64px]">{getTimeStr(entry.timestamp)}</span>
            <span className="text-sentinad-text-dim shrink-0 w-3 text-center">{prefix}</span>
            <span className={`shrink-0 w-[100px] font-semibold ${colorClass}`}>
                [{entry.agent}]
            </span>
            <span className={`flex-1 ${entry.type === 'roast' ? 'text-sentinad-orange italic' : entry.type === 'success' ? 'text-sentinad-green font-bold' : entry.type === 'scam' ? 'text-sentinad-red' : 'text-sentinad-text'}`}>
                {entry.message}
            </span>
        </div>
    );
}

export function Terminal() {
    const logs = useSentinadStore((s) => s.logs);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-full bg-sentinad-bg-terminal rounded-lg border border-sentinad-border box-glow-purple overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-sentinad-border bg-sentinad-bg-card">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-sentinad-red/80"></div>
                        <div className="w-3 h-3 rounded-full bg-sentinad-yellow/80"></div>
                        <div className="w-3 h-3 rounded-full bg-sentinad-green/80"></div>
                    </div>
                    <span className="ml-3 text-xs text-sentinad-text-dim font-mono">the-sentinad@monad:~</span>
                </div>
                <span className="text-[10px] text-sentinad-text-dim">LIVE THOUGHT STREAM</span>
            </div>

            {/* Log content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto terminal-scroll font-mono py-2"
            >
                {logs.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sentinad-text-dim text-sm">
                        <span className="typewriter-cursor pr-1">Waiting for connection...</span>
                    </div>
                )}
                {logs.map((log, i) => (
                    <LogLine key={i} entry={log} />
                ))}
            </div>
        </div>
    );
}
