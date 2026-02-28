# AGENTS.md — Understanding The Sentinad

> A beginner's guide to the architecture, the Web3 concepts, and how all the pieces fit together.

---

## TABLE OF CONTENTS

1. [What Is This Project?](#1-what-is-this-project)
2. [Web3 Concepts You Need First](#2-web3-concepts-you-need-first)
3. [The Five Agents Explained](#3-the-five-agents-explained)
4. [How They Talk to Each Other](#4-how-they-talk-to-each-other)
5. [The Tech Stack — Plain English](#5-the-tech-stack--plain-english)
6. [The Smart Contracts](#6-the-smart-contracts)
8. [What's Real vs. Simulated in the Demo](#8-whats-real-vs-simulated-in-the-demo)
9. [Glossary](#9-glossary)

---

## 1. What Is This Project?

The Sentinad is an **AI-powered arbitrage bot** built on the Monad blockchain.

In simple terms, it does two things at once:
- **Finds price gaps** between two exchanges and profits from them automatically
- **Checks if a contract is a scam** using AI *before* touching it with any money

Most trading bots are dumb calculators — they see a number difference and blindly execute. The Sentinad is smarter: it reads the actual smart contract code, sends it to an AI, and decides whether it's safe. If it's a scam, the AI roasts the developer in internet slang. If it's safe, it trades.

The whole thing is displayed on a live retro terminal UI with a purple aesthetic (Monad's brand color).

---

## 2. Web3 Concepts You Need First

### 🔗 Blockchain
A blockchain is a public, tamper-proof database shared across thousands of computers. Nobody "owns" it. Every transaction is recorded permanently. Think of it like Google Sheets — except nobody can delete rows, and everyone can see every entry.

### 💰 Token
A digital asset that lives on a blockchain. Like a stock, but for crypto. Examples: ETH, USDC, MON (Monad's native token).

### 🏦 DEX (Decentralized Exchange)
A trading platform that runs entirely as code on a blockchain — no company, no employees, no servers. Users trade directly from their wallets. **Kuru** is one such DEX on Monad.

Compare to a centralized exchange (CEX) like Coinbase, which has servers and employees.

### 📈 Arbitrage
If the same item is cheaper in one store than another, you buy from the cheap store and sell at the expensive one, pocketing the difference. Arbitrage is the same idea, but with tokens across different DEXs.

**Example:**
```
MON/USDC price on Kuru:       $1.00
MON/USDC price on Mock DEX:   $1.032

Buy on Kuru  → Sell on Mock DEX → Profit: 3.2%
```

This gap often exists for milliseconds before someone else closes it. Speed is everything.

### ⚡ Flash Loan
One of the most creative inventions in DeFi. A flash loan lets you:
1. Borrow a huge amount of money
2. Use it to trade
3. Repay it — all in the **same single transaction**

If anything in step 2 goes wrong, the entire transaction is cancelled as if it never happened. You never even lose the borrowed money. This means **you need zero upfront capital** to execute arbitrage.

```
Single Transaction:
  → Borrow 1000 MON
  → Buy 1000 USDC on DEX A (low price)
  → Sell 1000 USDC on DEX B (high price) → get 1032 MON
  → Repay 1000 MON + small fee
  → Keep 32 MON as profit
```

### 🪤 Honeypot
A scam token that looks legitimate. The dev lets you *buy* freely but secretly codes the *sell* function to be locked or broken. You're trapped — you can buy but can never sell. Your money is gone.

### 🏃 Rug Pull
The developer creates a token, attracts investors, then suddenly withdraws all the liquidity from the pool and disappears. The token price crashes to zero instantly. "They pulled the rug."

### 📜 Smart Contract
Code that lives on a blockchain. It runs automatically when conditions are met — no human needed to trigger it. It's like a vending machine: put in the right input, get the defined output, no cashier required.

Smart contracts are **immutable** — once deployed, the code cannot be changed (usually). This is why reading the code before interacting with it matters.

### ⛽ Gas
Every action on a blockchain costs a small fee called "gas," paid to the network validators for processing your transaction. If your profit from a trade is less than the gas cost, the trade loses money.

### 🌐 Testnet vs. Mainnet
- **Testnet:** A practice network. Tokens have no real value. Used for development and demos. All of this project runs on Monad Testnet.
- **Mainnet:** The real network. Real money. The Sentinad is built for testnet for now.

### 🧾 ABI (Application Binary Interface)
The "instruction manual" for a smart contract. It tells your code: "this contract has a function called `getPrice()`, call it like this, and expect a number back."

---

## 3. The Five Agents Explained

An "agent" here just means a module with a specific job. Think of them as workers in a factory, each doing one thing.

---

### Agent 1: Scanner — "The Hunter"

**What it does:** Watches prices on two DEXs every 500 milliseconds. The moment it finds a profitable gap, it raises an alarm.

**How it works:**
```
Every 500ms:
  1. Ask DEX1: "What's the price of MON/USDC?"
  2. Ask DEX2: "What's the price of MON/USDC?"
  3. Calculate: profit % = (price2 - price1) / price1 × 100
  4. If profit > 2%: fire an "opportunity found" event
```

**Why 2% threshold?** Anything below that is likely eaten by gas fees or too risky for the margin.

**Analogy:** A hawk circling overhead, watching for movement (price gaps) on the ground.

---

### Agent 2: Vibe Agent — "The Auditor"

**What it does:** Before any money moves, this agent asks AI: *"Is this contract safe or a scam?"*

This is the unique innovation of The Sentinad. Other bots skip this step entirely.

**How it works:**
```
1. Receive the "opportunity found" event from Scanner
2. Check cache: "Have we audited this contract before?"
   → Yes: use cached result (no need to call AI again)
   → No: proceed to audit
3. Fetch the contract's source code
4. Send to GPT-4o-mini with this system prompt:
   "You are The Sentinad, an elite security agent.
    Check this contract for honeypots and rug pulls.
    If safe: say 'Gmonad, this one's legit'
    If scam: roast the dev in Monad slang"
5. Parse AI response: { safe: true/false, confidence: 94%, roast: "..." }
6. Cache result for 1 hour
7. Pass verdict to Orchestrator
```

**What "Monad slang" means:**
- **Gmonad** = Good morning / Good luck (like "GM" in crypto culture)
- **Chog** = Cool / Awesome
- **Molandak** = Sketchy / Questionable
- **Mid-curve** = A mediocre, unserious scammer
- **Purple** = Monad's brand color, used as an identity marker

**Example AI responses:**
```
Safe contract:
"Gmonad, this one's legit. Clean transfer logic, no hidden fees. Chog."

Scam contract:
"This dev locked the sell function and hid it behind a proxy. 
Mid-curve molandak energy. Hard pass."
```

**Analogy:** A security expert reviewing a building's blueprints before anyone enters.

---

### Agent 3: Executor — "The Striker"

**What it does:** Only activates when Vibe Agent says `safe: true`. Builds and sends the flash arbitrage transaction.

**How it works:**
```
If safe == true:
  1. Build a flash loan transaction using Arbiter.sol
  2. Flash borrow tokenA from DEX1
  3. Swap tokenA → tokenB on DEX1 (buy where it's cheap)
  4. Swap tokenB → tokenA on DEX2 (sell where it's expensive)
  5. Repay flash loan
  6. Keep the profit
  7. Report: { txHash, profit, executionTime }
```

**For the MVP demo:** This step is simulated (logs a realistic fake transaction) to avoid gas/debugging issues under the 7-hour hackathon time pressure.

**Analogy:** A sniper who only shoots when given the green light. Precise, fast, no hesitation.

---

### Agent 4: Orchestrator — "The Brain"

**What it does:** Coordinates all the other agents. Nobody talks to each other directly — they all talk through the Orchestrator.

It works like a **state machine** — the system is always in exactly one state at a time:

```
┌─────────────────────────────────────────────────────────┐
│                   STATE MACHINE                         │
│                                                         │
│  IDLE ──(gap found)──▶ AUDITING ──(safe)──▶ EXECUTING  │
│   ▲                        │                    │      │
│   │                    (scam)              (confirmed) │
│   │                        │                    │      │
│   └──────────────── ROASTING ◀─────────── SUCCESS      │
└─────────────────────────────────────────────────────────┘
```

It also:
- Keeps track of global stats (total scans, scams dodged, profits earned)
- Pushes every event to the frontend in real time via WebSocket

**Analogy:** An air traffic controller. All planes (agents) communicate through them, never directly with each other.

---

### Agent 5: Terminal UI — "The Showpiece"

**What it does:** A live, retro-style terminal dashboard displayed in the browser. Shows the agent's "internal thoughts" as they happen.

**Three panels:**

**① Live Thought Stream** (scrolling terminal log)
```
[Scanner]   Price gap detected: MON/USDC — 3.2% arb available
[Vibe]      Fetching contract 0x742d35Cc6634...
[Vibe]      Running AI audit...
[Vibe]      Gmonad! Contract is clean. Confidence: 94%
[Executor]  Sending flash arb transaction...
[SUCCESS]   Printed 2.4 MON in 1.2 seconds ✓
```

**② Stats Panel**
```
┌─────────────────────────┐
│  SENTINAD STATS         │
├─────────────────────────┤
│  Scans Run:       142   │
│  Scams Dodged:      7   │
│  Trades Executed:   3   │
│  Total Profit:  8.3 MON │
└─────────────────────────┘
```

**③ Roast Gallery** — the best AI burns on scam contracts, displayed for laughs.

---

## 4. How They Talk to Each Other

The agents communicate using an **event-driven** system. Instead of directly calling each other, they broadcast events and listen for them.

```
Scanner          Orchestrator        Vibe Agent       Executor
   │                  │                   │               │
   │──opportunity──▶  │                   │               │
   │                  │──start audit──▶   │               │
   │                  │                   │──fetch code   │
   │                  │                   │──call OpenAI  │
   │                  │  ◀──verdict(safe)──│               │
   │                  │──execute──────────────────────▶   │
   │                  │                   │  ◀──tx hash───│
   │                  │                   │               │
   │           (push to UI via WebSocket)                 │
```

**WebSocket** is the technology that keeps the browser UI updated in real time without refreshing the page. The Orchestrator sends events over WebSocket; the frontend listens and updates the terminal display instantly.

---

## 5. The Tech Stack — Plain English

### Frontend (What you see in the browser)
| Tool | What it does |
|------|-------------|
| **React + Vite** | JavaScript framework for building the UI. Vite makes it fast to develop. |
| **Tailwind CSS** | Utility CSS classes for styling. Purple theme: `#8B5CF6` |
| **socket.io-client** | Receives real-time events from the backend (the live terminal updates) |
| **ethers.js** | Library to interact with the Monad blockchain from JavaScript |
| **Zustand** | Simple state management — keeps track of stats, logs, etc. |

### Backend (The server running the agents)
| Tool | What it does |
|------|-------------|
| **Node.js + TypeScript** | Server-side JavaScript. TypeScript adds type safety. |
| **Express.js** | Web framework — handles HTTP routes and starts the server |
| **socket.io** | Sends real-time events to all connected browser clients |
| **ethers.js** | Interacts with Monad blockchain contracts from Node.js |
| **OpenAI SDK** | Calls GPT-4o-mini for the AI audit |
| **node-cron** | Runs the scanner on a timer (every 500ms) |

### Blockchain Layer
| Tool | What it does |
|------|-------------|
| **Monad Testnet** | The blockchain network the contracts are deployed on |
| **Solidity** | Programming language for smart contracts |
| **Hardhat** | Development environment: compile, test, deploy contracts |
| **Arbiter.sol** | The flash arbitrage contract — handles the actual trade logic |

### Data & Caching
| Tool | What it does |
|------|-------------|
| **Redis** | In-memory key-value store. Used to cache AI audit results by contract address. |
| **In-memory Map** | Simpler fallback if Redis isn't available (just a JavaScript object) |

---

## 6. The Smart Contracts

Two contracts, written in Solidity:

### Arbiter.sol — The Flash Arb Engine
This is the contract that actually executes the trade on-chain.

When triggered, it runs this sequence atomically (all-or-nothing):
1. Flash borrow from DEX1
2. Execute the arbitrage swaps
3. Repay the loan
4. Send profit to the owner's wallet

"Atomic" means if any step fails, **everything reverts**. You never lose the borrowed capital.

### VibeRegistry.sol — On-chain Roast Log (Optional)
Stores the best AI roasts permanently on the blockchain. Imagine a public hall of shame where scam contract addresses and their roasts are permanently recorded. This is a nice-to-have for the demo.

---

## 7. The Full Data Flow (Step by Step)

Here's the entire system working from start to finish:

```
1. App starts → Orchestrator initializes all agents

2. Scanner polls DEX prices every 500ms:
   GET kuru.getPrice("MON", "USDC") → $1.000
   GET mockDex.getPrice("MON", "USDC") → $1.032
   Gap = 3.2% → ABOVE threshold

3. Scanner emits: "opportunity" event
   { pair: "MON/USDC", buyDex: "Kuru", sellDex: "MockDex", profit: 3.2% }

4. Orchestrator receives event → state = AUDITING
   WebSocket push to UI: "Scanner: Gap found, 3.2%"

5. Vibe Agent activates:
   → Check Redis: contract not cached
   → Fetch contract source from block explorer API
   → POST to OpenAI: { system: "[audit prompt]", user: "[contract code]" }
   → Response: { safe: true, confidence: 94, roast: "Gmonad, this one's legit" }
   → Cache in Redis: contractAddress → { safe: true, ... }

6. Vibe Agent emits: "verdict" event { safe: true }
   WebSocket push to UI: "Vibe Agent: Confidence 94% — SAFE"

7. Orchestrator: safe = true → state = EXECUTING
   
8. Executor Agent activates:
   → Build flash arb transaction via Arbiter.sol
   → Sign with private key from .env
   → Submit to Monad Testnet
   → Wait for confirmation (~500ms on Monad)
   → Emit: { txHash: "0xabc...", profit: 2.4, timeMs: 1200 }

9. Orchestrator: state = SUCCESS
   → Update global stats: profit += 2.4, tradesExecuted += 1
   WebSocket push to UI: "SUCCESS: Printed 2.4 MON in 1.2s"

10. State resets → IDLE → Scanner continues polling
```

---

## 8. What's Real vs. Simulated in the Demo

For a 7-hour hackathon, some parts are simplified intentionally. This is standard practice.

| Component | Status | Notes |
|-----------|--------|-------|
| Price Scanner | ✅ Real | Polls actual Kuru DEX on Monad Testnet |
| Vibe Agent (AI) | ✅ Real | Actual GPT-4o-mini API calls |
| Contract Deployment | ✅ Real | Arbiter.sol deployed on Monad Testnet |
| Trade Execution | 🟡 Simulated | Logs a realistic trade, avoids gas debugging |
| Redis Cache | 🟡 Simplified | Uses in-memory Map instead |
| Profit Numbers | 🟡 Seeded | Some pre-loaded data for a dramatic demo |
| Roast Gallery | ✅ Real | Actual AI-generated roasts from test contracts |

**Why simulate execution?** If a real transaction fails during a live demo (network spike, gas estimation error), it derails the entire presentation. A convincing simulation with realistic timing is strategically better for a hackathon.

---

## 9. Glossary

| Term | Plain English Definition |
|------|--------------------------|
| **Agent** | A module with a single focused job |
| **Arbitrage** | Profit from price differences across markets |
| **ABI** | The instruction manual for calling a smart contract |
| **Atomic Transaction** | All steps succeed or all steps revert — never partial |
| **Blockchain** | A public, tamper-proof distributed ledger |
| **DEX** | Decentralized exchange — trading without a company |
| **Flash Loan** | Borrow → Trade → Repay, all in one transaction |
| **Gas** | Fee paid to the blockchain network to process a transaction |
| **Honeypot** | Scam: lets you buy but traps your money (can't sell) |
| **Liquidity Pool** | The pool of tokens a DEX uses to facilitate trades |
| **Mainnet** | The real blockchain with real money |
| **Orchestrator** | The coordinator agent — everyone reports to it |
| **Rug Pull** | Scam: developer withdraws all liquidity and disappears |
| **Smart Contract** | Self-executing code deployed on a blockchain |
| **Solidity** | The programming language used to write smart contracts |
| **State Machine** | A system that is always in exactly one of a defined set of states |
| **Testnet** | A practice blockchain — tokens have no real value |
| **WebSocket** | Protocol for real-time two-way communication between server and browser |
| **Web3** | The ecosystem of decentralized blockchain-based applications |
| **Gmonad** | Monad community slang for "good morning" / "good luck" |
| **Molandak** | Monad slang for something sketchy or suspicious |
| **Chog** | Monad slang for cool/awesome |
| **Mid-curve** | A mediocre, unserious scammer |
