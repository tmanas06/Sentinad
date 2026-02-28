# The Sentinad

> AI-Powered Arbitrage Bot on Monad Blockchain

**The Sentinad** is an intelligent arbitrage bot that doesn't just look at the math — it checks the *vibe*. Before executing any trade, it performs a sub-second AI audit on every smart contract, roasting scammers in Monad community slang while safely printing MON on legitimate opportunities.

## Architecture

```
Scanner Agent → Orchestrator → Vibe Agent (AI Audit) → Executor Agent
     ↓                ↓               ↓                     ↓
  DEX Prices    State Machine    GPT-4o-mini         Flash Arbitrage
                     ↓
              Terminal UI (React)
```

**Five Agents:**
- **Scanner** — Monitors price gaps across Kuru DEX + MockDex every 3s
- **Vibe Agent** — AI contract auditor using GPT-4o-mini with Monad slang
- **Executor** — Simulated flash arbitrage execution with realistic timing
- **Orchestrator** — State machine coordinating the pipeline
- **Terminal UI** — Retro purple CRT dashboard with live thought stream

## Quick Start

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with your keys:
#   OPENAI_API_KEY (optional — runs in demo mode without it)
#   PRIVATE_KEY (for contract deployment)
#   MONAD_RPC_URL
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the dashboard connects automatically.

### 4. Smart Contracts (optional)
```bash
cd contracts
npm install
npx hardhat compile
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS v4, Zustand, socket.io-client |
| Backend | Node.js, TypeScript, Express, socket.io, OpenAI SDK, ethers.js |
| Blockchain | Solidity 0.8.24, Hardhat, Monad Testnet |

## Project Structure

```
sentinad/
├── contracts/           # Hardhat + Solidity
│   └── contracts/
│       ├── Arbiter.sol          # Flash arb engine
│       └── VibeRegistry.sol     # On-chain roast log
├── backend/             # Node.js + TypeScript
│   └── src/
│       ├── agents/
│       │   ├── scanner.ts       # Price monitor
│       │   ├── vibe.ts          # AI auditor
│       │   └── executor.ts      # Trade executor
│       ├── orchestrator.ts      # State machine
│       ├── websocket.ts         # Real-time events
│       └── index.ts             # Express entry point
├── frontend/            # React + Vite
│   └── src/
│       ├── components/
│       │   ├── Terminal.tsx      # Live thought stream
│       │   ├── StatsPanel.tsx    # Metrics dashboard
│       │   └── RoastGallery.tsx  # Scam roast gallery
│       ├── hooks/useSocket.ts   # WebSocket hook
│       ├── store.ts             # Zustand state
│       └── App.tsx              # Main layout
├── .env.example
└── README.md
```

## Demo Mode

The Sentinad runs in **demo mode** by default (no API keys required). It uses:
- Simulated price feeds with periodic arbitrage opportunities
- Pre-computed AI audit results for sample contracts (both safe and scam)
- Simulated trade execution with realistic timing

Add your `OPENAI_API_KEY` in `.env` to enable real GPT-4o-mini audits.

---

*Built for the Monad Hackathon. Gmonad!*
