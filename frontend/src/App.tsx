/**
 * App — The Sentinad Dashboard
 * Main layout: retro terminal container with three panels.
 */

import { useSocket } from './hooks/useSocket';
import { Terminal } from './components/Terminal';
import { StatsPanel } from './components/StatsPanel';
import { RoastGallery } from './components/RoastGallery';
import { useSentinadStore } from './store';
import { Shield } from 'lucide-react';

function App() {
  useSocket();
  const connected = useSentinadStore((s) => s.connected);

  return (
    <div className="h-screen w-screen bg-sentinad-bg flex flex-col overflow-hidden crt-flicker">
      {/* CRT Scanline overlay */}
      <div className="crt-overlay" />

      {/* Top bar */}
      <header className="shrink-0 px-6 py-3 flex items-center justify-between border-b border-sentinad-border bg-sentinad-bg-card/80">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-sentinad-purple" />
          <div>
            <h1 className="text-lg font-bold tracking-widest glow-purple text-sentinad-purple-light">
              THE SENTINAD
            </h1>
            <p className="text-[10px] text-sentinad-text-dim tracking-wider -mt-0.5">
              AI-POWERED ARBITRAGE ◆ MONAD TESTNET
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-sentinad-green status-online' : 'bg-sentinad-red pulse-glow'}`} />
            <span className="text-xs text-sentinad-text-dim font-mono">
              {connected ? 'CONNECTED' : 'CONNECTING...'}
            </span>
          </div>
          <div className="h-4 w-px bg-sentinad-border" />
          <span className="text-[10px] text-sentinad-purple-light font-mono">v1.0.0</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left: Terminal (takes most space) */}
        <div className="flex-[2] min-w-0">
          <Terminal />
        </div>

        {/* Right: Stats + Roast Gallery */}
        <div className="flex-[1] flex flex-col gap-4 min-w-[280px] max-w-[360px]">
          <div className="shrink-0" style={{ height: '45%' }}>
            <StatsPanel />
          </div>
          <div className="flex-1 min-h-0">
            <RoastGallery />
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="shrink-0 px-6 py-1.5 border-t border-sentinad-border bg-sentinad-bg-card/50 flex items-center justify-between">
        <span className="text-[10px] text-sentinad-text-dim font-mono">
          ◆ Monad Testnet  ◆ Kuru DEX + MockDex  ◆ GPT-4o-mini Auditor
        </span>
        <span className="text-[10px] text-sentinad-purple-light/50 font-mono">
          Built for Monad Hackathon
        </span>
      </footer>
    </div>
  );
}

export default App;
