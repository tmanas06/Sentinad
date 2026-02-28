/**
 * Stats Panel — Live Dashboard Metrics
 * ASCII-bordered stats with animated counters.
 */

import { useSentinadStore } from '../store';
import { Activity, ShieldAlert, Zap, TrendingUp, Clock, Wifi } from 'lucide-react';

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const STATE_COLORS: Record<string, string> = {
    IDLE: 'text-sentinad-text-dim',
    SCANNING: 'text-sentinad-cyan',
    AUDITING: 'text-sentinad-yellow',
    EXECUTING: 'text-sentinad-green',
    ROASTING: 'text-sentinad-orange',
    SUCCESS: 'text-sentinad-green',
};

const STATE_LABELS: Record<string, string> = {
    IDLE: 'IDLE — Monitoring',
    SCANNING: 'SCANNING — Gap Found',
    AUDITING: 'AUDITING — Vibe Check',
    EXECUTING: 'EXECUTING — Flash Arb',
    ROASTING: 'ROASTING — Scam Detected',
    SUCCESS: 'SUCCESS — Trade Complete',
};

export function StatsPanel() {
    const stats = useSentinadStore((s) => s.stats);
    const connected = useSentinadStore((s) => s.connected);
    const systemState = useSentinadStore((s) => s.systemState);

    return (
        <div className="bg-sentinad-bg-card rounded-lg border border-sentinad-border box-glow-purple overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-sentinad-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-sentinad-purple-light glow-purple tracking-wider">
                    SENTINAD STATS
                </h2>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-sentinad-green status-online' : 'bg-sentinad-red'}`}></div>
                    <span className="text-[10px] text-sentinad-text-dim">{connected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>

            {/* State indicator */}
            <div className="px-4 py-2 border-b border-sentinad-border/50">
                <div className="flex items-center gap-2">
                    <Wifi size={12} className={`${STATE_COLORS[systemState] || 'text-sentinad-text-dim'} ${systemState !== 'IDLE' ? 'pulse-glow' : ''}`} />
                    <span className={`text-xs font-mono ${STATE_COLORS[systemState] || 'text-sentinad-text-dim'}`}>
                        {STATE_LABELS[systemState] || systemState}
                    </span>
                </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 px-4 py-3 space-y-3">
                <StatRow
                    icon={<Activity size={14} />}
                    label="Scans Run"
                    value={stats.scansRun.toLocaleString()}
                    color="text-sentinad-cyan"
                />
                <StatRow
                    icon={<ShieldAlert size={14} />}
                    label="Scams Dodged"
                    value={stats.scamsDodged.toString()}
                    color="text-sentinad-red"
                />
                <StatRow
                    icon={<Zap size={14} />}
                    label="Trades Executed"
                    value={stats.tradesExecuted.toString()}
                    color="text-sentinad-green"
                />
                <StatRow
                    icon={<TrendingUp size={14} />}
                    label="Total Profit"
                    value={`${stats.totalProfit.toFixed(2)} MON`}
                    color="text-sentinad-purple-light"
                    highlight
                />
                <div className="pt-1 border-t border-sentinad-border/30">
                    <StatRow
                        icon={<Clock size={14} />}
                        label="Uptime"
                        value={formatUptime(stats.uptime)}
                        color="text-sentinad-text-dim"
                    />
                </div>
            </div>
        </div>
    );
}

function StatRow({ icon, label, value, color, highlight }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sentinad-text-dim">
                <span className={color}>{icon}</span>
                <span className="text-xs">{label}</span>
            </div>
            <span className={`text-sm font-bold font-mono stat-update ${highlight ? `${color} glow-purple` : color}`}>
                {value}
            </span>
        </div>
    );
}
