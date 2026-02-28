/**
 * useSocket Hook — WebSocket Connection to Backend
 * Connects to the backend via socket.io and dispatches events to Zustand store.
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSentinadStore } from '../store';

const BACKEND_URL = 'http://localhost:3001';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const { addLog, updateStats, addRoast, setConnected, setSystemState } = useSentinadStore();

    useEffect(() => {
        const socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected to The Sentinad');
            setConnected(true);
            addLog({
                agent: 'System',
                message: 'Connected to The Sentinad backend.',
                type: 'system',
                timestamp: Date.now(),
            });
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setConnected(false);
            addLog({
                agent: 'System',
                message: 'Disconnected from backend. Attempting reconnection...',
                type: 'error',
                timestamp: Date.now(),
            });
        });

        socket.on('log', (data) => {
            addLog(data);
        });

        socket.on('stats-update', (data) => {
            updateStats(data);
        });

        socket.on('roast', (data) => {
            addRoast(data);
        });

        socket.on('state-change', (data) => {
            setSystemState(data.state);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return socketRef;
}
