# THE SENTINAD - MVP ARCHITECTURE

## HIGH-LEVEL DESIGN

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Purple Terminal UI (React + Vite)                │    │
│  │   - Live "Thought Stream"                          │    │
│  │   - Trade Execution Log                            │    │
│  │   - Stats Dashboard (Profit, Scans, Roasts)       │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────────────┘
                   │ WebSocket (Real-time updates)
┌──────────────────┴──────────────────────────────────────────┐
│                    BACKEND LAYER                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Orchestrator (Node.js/Python FastAPI)            │    │
│  │   - Coordinates all agents                         │    │
│  │   - Event emitter for UI updates                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Scanner Agent│  │  Vibe Agent  │  │ Executor Agent│     │
│  │              │  │              │  │               │     │
│  │ • Monitors   │  │ • AI Audit   │  │ • Flash Arb   │     │
│  │   DEX prices │  │ • Contract   │  │ • Transaction │     │
│  │ • Calculates │  │   analysis   │  │   execution   │     │
│  │   arb opps   │  │ • Roast gen  │  │ • Gas opt     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │  Monad Testnet   │  │  Smart Contracts             │    │
│  │  • DEX 1 (Kuru)  │  │  • Arbiter.sol (Flash Arb)   │    │
│  │  • DEX 2 (Mock)  │  │  • VibeRegistry.sol (Scores) │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────┐          ┌──────────────────┐
│  AI/ML Layer    │          │  Data Layer      │
│  • OpenAI API   │          │  • Redis (Cache) │
│  • GPT-4o-mini  │          │  • MongoDB/JSON  │
└─────────────────┘          └──────────────────┘
```

---

## COMPONENT BREAKDOWN

### 1. SCANNER AGENT (The Hunter)

**Purpose:** Constantly monitors price differences across DEXs

**Responsibilities:**
- Poll DEX pools for token prices (e.g., MON/USDC on Kuru vs. Mock DEX)
- Calculate arbitrage opportunity (% profit after gas)
- Emit "opportunity found" event when threshold met (e.g., >2% profit)

**Data Flow:**
```
Every 500ms:
  → Query DEX1.getPrice(tokenA, tokenB)
  → Query DEX2.getPrice(tokenA, tokenB)
  → Calculate: profit = (price2 - price1) / price1 * 100
  → If profit > threshold:
      → Emit event: { pairAddress, buyDex, sellDex, profit }
```

---

### 2. VIBE AGENT (The Auditor)

**Purpose:** AI-powered security audit before execution

**Responsibilities:**
- Fetch smart contract source code (from block explorer API or local cache)
- Send to LLM with specialized system prompt
- Parse response: SAFE vs. SCAM + roast message
- Cache results (same contract = skip re-audit)

**AI System Prompt:**
```
You are "The Sentinad," an elite Monad security agent. Analyze this Solidity contract for:
1. Honeypot patterns (locked sell functions, fake liquidity)
2. Rug-pull vectors (owner privileges, pausable transfers)
3. Malicious code (hidden fees, blacklist functions)

Response format:
{
  "safe": true/false,
  "confidence": 0-100,
  "roast": "If scam, roast the dev in Monad slang. If safe, say 'Gmonad, this one's legit'"
}

Monad slang vocabulary: Gmonad (good morning/good luck), Chog (cool/awesome), Molandak (questionable), mid-curve (mediocre scammer), purple (Monad brand color)
```

**Data Flow:**
```
On "opportunity found":
  → Check cache: has this contract been audited?
  → If yes: return cached verdict
  → If no:
      → Fetch contract code (Etherscan/Sourcify API)
      → Call OpenAI API with system prompt + contract code
      → Parse JSON response
      → Cache result (contract_address → verdict)
      → Emit: { safe, confidence, roast }
```

---

### 3. EXECUTOR AGENT (The Striker)

**Purpose:** Execute flash arbitrage if Vibe Check passes

**Responsibilities:**
- Only triggered if `safe: true` from Vibe Agent
- Construct flash arbitrage transaction
- Submit to Monad testnet
- Monitor transaction status

**Data Flow:**
```
If vibe_check.safe == true:
  → Construct transaction:
      1. Flash loan from DEX1 (borrow tokenA)
      2. Swap tokenA → tokenB on DEX1 (buy low)
      3. Swap tokenB → tokenA on DEX2 (sell high)
      4. Repay flash loan + profit
  → Sign with private key
  → Send via Web3 provider
  → Emit: { txHash, status, profit }
```

---

### 4. ORCHESTRATOR (The Brain)

**Purpose:** Coordinates all agents and manages state

**Responsibilities:**
- Initialize all agents on startup
- Listen for events from Scanner → trigger Vibe → trigger Executor
- Maintain global state (total scans, roasts, profits)
- Stream events to frontend via WebSocket

**Pseudo-State Machine:**
```
State: IDLE
  → Scanner finds opportunity → State: SCANNING

State: SCANNING
  → Vibe check starts → State: AUDITING

State: AUDITING
  → If safe → State: EXECUTING
  → If scam → State: ROASTING (log roast, return to IDLE)

State: EXECUTING
  → Transaction sent → State: PENDING
  → Transaction confirmed → State: SUCCESS (return to IDLE)
```

---

### 5. TERMINAL UI (The Showpiece)

**Purpose:** Retro hacker aesthetic that displays agent "thoughts"

**Key Features:**

#### Live Thought Stream
Scrolling terminal showing agent internal monologue:
- "Scanner: Price gap detected on MON/USDC - 3.2% arb available"
- "Vibe Agent: Running security audit on 0x742d..."
- "Vibe Agent: Gmonad! Contract is clean. Confidence: 94%"
- "Executor: Sending flash arb transaction..."
- "SUCCESS: Printed 2.4 MON in 1.2 seconds"

#### Stats Panel
```
┌─────────────────────────┐
│  SENTINAD STATS         │
├─────────────────────────┤
│  Scans Run: 142         │
│  Scams Dodged: 7        │
│  Trades Executed: 3     │
│  Total Profit: 8.3 MON  │
└─────────────────────────┘
```

#### Roast Gallery
Best AI roasts displayed:
```
Recent Roasts:
"This contract is more sus than a mid-curve trying to fork Uniswap. Pass."
"Dev locked the sell function? Molandak energy detected. Hard pass."
```

---

## TECH STACK

### Frontend
```
Framework: React 18 + Vite
Styling: Tailwind CSS (purple theme: #8B5CF6, #6D28D9)
Terminal: xterm.js or custom ASCII art component
WebSocket: socket.io-client
Web3: ethers.js v6 (for wallet connection, read-only for demo)
State Management: Zustand or React Context
Icons: lucide-react
```

### Backend

**Option A (Recommended): Node.js + TypeScript**
```
Framework: Express.js
WebSocket: socket.io
Web3: ethers.js v6
AI: OpenAI Node SDK
Scheduler: node-cron (for scanner polling)
```

**Option B: Python + FastAPI**
```
Framework: FastAPI
WebSocket: fastapi.websockets
Web3: web3.py
AI: openai Python SDK
Async: asyncio
```

**Recommendation:** Node.js for faster prototyping with ethers.js, single language for fullstack

### Blockchain
```
Network: Monad Testnet
RPC: https://testnet.monad.xyz (or provided RPC)
Smart Contracts: Solidity 0.8.20+
  - Arbiter.sol (flash arb executor)
  - VibeRegistry.sol (on-chain roast log - optional for demo)
Development: Hardhat or Foundry
Wallet: Private key in .env (demo purposes only)
```

### AI/ML
```
Provider: OpenAI API
Model: gpt-4o-mini (fast + cheap, <500ms response)
Fallback: gpt-3.5-turbo (if budget constraint)
Alternative: Anthropic Claude (if OpenAI fails)
System Prompt: Stored in config file
```

### Data & Caching
```
Cache: Redis (in-memory, fast lookups)
  - Key: contract_address
  - Value: { safe, confidence, roast, timestamp }
  - TTL: 1 hour (re-audit after expiry)

Fallback: In-memory Map (if Redis unavailable)

Logs: JSON file or MongoDB (for post-demo analytics)
```

### DevOps
```
Environment: .env file
  - MONAD_RPC_URL
  - PRIVATE_KEY
  - OPENAI_API_KEY
  - REDIS_URL (optional)

Deployment: 
  - Local: npm run dev (for hackathon demo)
  - Optional: Railway/Render for public access
```

---

## MVP SCOPE (7-Hour Build)

### MUST-HAVE (Core Demo)

- **Scanner Agent:** Monitor 2 hardcoded DEX pairs (Kuru + Mock)
- **Vibe Agent:** AI audit with OpenAI, roast generation
- **Terminal UI:** Live thought stream + basic stats
- **Executor Agent:** Simulated transaction (log instead of real tx for speed)
- **1 Smart Contract:** Basic flash arb contract (even if not executed live)

### NICE-TO-HAVE (If Time Permits)

- Real transaction execution (risk: debugging gas issues)
- Redis caching (can use in-memory Map)
- VibeRegistry.sol (on-chain roast storage)
- Roast gallery UI component
- Multiple token pairs

### SKIP FOR MVP

- User wallet connection (demo wallet only)
- Historical profit charts
- Discord/Telegram bot integration
- Mobile responsive design

---

## DEMO SCRIPT (5 Minutes)

### Minute 1: The Problem
- "Arbitrage bots on new chains lose money to scams"
- Show stat: "$1B lost to rug-pulls in 2024"

### Minute 2: The Solution
- "The Sentinad: An AI agent that does 'Vibe Checks'"
- Show architecture diagram (1 slide)

### Minute 3: Live Demo
- Terminal UI on projector
- Agent finds price gap → runs audit → roasts scam contract
- Second opportunity → passes audit → "executes trade" (simulated)
- Show profit stats

### Minute 4: The Monad Advantage
- "Only possible on Monad's 10K TPS"
- "Sub-second AI + execution beats human traders"

### Minute 5: Q&A + Code Walkthrough
- Show AI prompt engineering (the roast template)
- Show smart contract Arbiter.sol
- "This is just the beginning - imagine multi-chain vibe checks"

---

## 7-HOUR BUILD TIMELINE

### Hour 1: Setup + Smart Contracts
- Hardhat init, deploy basic Arbiter.sol to Monad testnet
- Test with mock DEX pair

### Hour 2: Scanner Agent
- Build price monitor, emit events when gap found
- Test with console logs

### Hour 3: Vibe Agent
- OpenAI integration, system prompt engineering
- Test with sample contracts (1 safe, 1 rug)

### Hour 4: Orchestrator + Event Flow
- Wire Scanner → Vibe → Executor
- Add logging/state management

### Hour 5: Terminal UI (Frontend)
- React setup, purple terminal component
- WebSocket connection to backend
- Display thought stream

### Hour 6: Integration + Testing
- End-to-end test: Scanner → Vibe → Executor → UI
- Fix bugs, add stats panel

### Hour 7: Polish + Demo Prep
- Add roast gallery
- Seed fake data for dramatic demo
- Practice demo script

---

## DIFFERENTIATION vs. Existing Projects

| Feature | Traditional Bots | GoPlus API | The Sentinad |
|---------|-----------------|-----------|--------------|
| Security Check | None | Risk scores | AI code audit |
| Personality | Boring | Boring | Degen roasts |
| Speed | Fast | Slow (1-2s) | Sub-second |
| Monad Native | Generic | Generic | Purple-themed |
| Entertainment | None | None | Viral potential |

---

## POST-HACKATHON ROADMAP (Optional Slide)

### v2 Features (if we win):

- Multi-chain vibe checks (Base, Arbitrum)
- Community reputation: users upvote best roasts → earn NFT badges
- VibeDAO: vote on which contracts to blacklist
- Telegram bot: `/vibecheck <address>`
- On-chain roast NFTs (mint the best burns)

---

## PROJECT STRUCTURE

```
sentinad/
├── contracts/
│   ├── Arbiter.sol
│   ├── VibeRegistry.sol (optional)
│   └── test/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── scanner.ts
│   │   │   ├── vibe.ts
│   │   │   └── executor.ts
│   │   ├── orchestrator.ts
│   │   ├── websocket.ts
│   │   └── index.ts
│   ├── config/
│   │   └── prompts.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Terminal.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── RoastGallery.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
├── .env.example
└── README.md
```

---

## NEXT STEPS

1. **Create the AI system prompt template** (exact wording for GPT-4o-mini)
2. **Draft Arbiter.sol** (the flash arb smart contract)
3. **Build a starter repo structure** with folder organization
4. **Design the Terminal UI wireframe** (purple aesthetic mockup)

---

## KEY SUCCESS METRICS FOR DEMO

1. **Visual Impact:** Terminal shows live "thinking" - judges see the AI reasoning
2. **Humor:** At least 3 memorable roasts during demo
3. **Speed:** Sub-2 second from detection to decision
4. **Technical Depth:** Show smart contract + AI prompt + real-time execution
5. **Monad Native:** Purple everywhere, use Monad slang, emphasize 10K TPS advantage

---

## RISK MITIGATION

### Technical Risks

**Risk:** OpenAI API rate limits during demo
**Mitigation:** Cache 5 pre-computed roasts, show cached results

**Risk:** Monad testnet RPC fails
**Mitigation:** Use local Hardhat fork with seeded DEX contracts

**Risk:** Transaction execution fails
**Mitigation:** Simulate execution with realistic delays (1-2s), show logs

**Risk:** WebSocket disconnects
**Mitigation:** Add reconnection logic, fallback to HTTP polling

### Time Risks

**Risk:** Smart contract debugging takes 2+ hours
**Mitigation:** Use battle-tested Uniswap V2 fork interfaces, minimal custom logic

**Risk:** AI prompt engineering takes too long
**Mitigation:** Start with simple prompt, iterate only if time permits

**Risk:** Terminal UI polish takes too long
**Mitigation:** Use xterm.js library (pre-built terminal), focus on content not styling

---

## WINNING FACTORS FOR PEER VOTING

1. **Entertainment Value:** Judges remember the roasts
2. **Technical Competence:** Multi-component system shows depth
3. **Monad Specific:** Built for Monad's unique properties (speed)
4. **Practical Use Case:** Solves real problem (rug-pulls)
5. **Polish:** Terminal UI looks professional despite 7-hour timeline
6. **Memorable Demo:** Live execution with personality

---

## BACKUP PLAN (If Behind Schedule)

### 4-Hour Minimum Viable Demo

If running behind, cut to these essentials:
1. Hardcoded scanner (fake price data)
2. Vibe Agent with 2 pre-written contract examples
3. Basic terminal UI showing pre-scripted thought stream
4. No real blockchain execution
5. Focus demo on AI roast quality + concept

This still showcases:
- The core innovation (AI vibe check)
- The personality (roasts)
- The vision (arbitrage + security)

Better to have polished fake demo than buggy real one.
