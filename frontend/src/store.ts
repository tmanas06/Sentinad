/**
 * Zustand Store — Global State Management
 * Manages logs, stats, roasts, and connection status.
 */

import { create } from 'zustand';

export interface LogEntry {
    agent: string;
    message: string;
    type: string;
    timestamp: number;
}

export interface Stats {
    scansRun: number;
    scamsDodged: number;
    tradesExecuted: number;
    totalProfit: number;
    uptime: number;
    state: string;
}

export interface RoastEntry {
    contractAddress: string;
    roast: string;
    confidence: number;
    timestamp: number;
}

interface SentinadStore {
    // State
    logs: LogEntry[];
    stats: Stats;
    roasts: RoastEntry[];
    connected: boolean;
    systemState: string;

    // Actions
    addLog: (log: LogEntry) => void;
    updateStats: (stats: Stats) => void;
    addRoast: (roast: RoastEntry) => void;
    setConnected: (connected: boolean) => void;
    setSystemState: (state: string) => void;
}

export const useSentinadStore = create<SentinadStore>((set) => ({
    logs: [],
    stats: {
        scansRun: 0,
        scamsDodged: 0,
        tradesExecuted: 0,
        totalProfit: 0,
        uptime: 0,
        state: 'IDLE',
    },
    roasts: [],
    connected: false,
    systemState: 'IDLE',

    addLog: (log) =>
        set((state) => ({
            logs: [...state.logs.slice(-200), log], // Keep last 200 logs
        })),

    updateStats: (stats) =>
        set(() => ({
            stats,
            systemState: stats.state,
        })),

    addRoast: (roast) =>
        set((state) => ({
            roasts: [roast, ...state.roasts].slice(0, 50), // Keep last 50 roasts, newest first
        })),

    setConnected: (connected) => set(() => ({ connected })),

    setSystemState: (systemState) => set(() => ({ systemState })),
}));
