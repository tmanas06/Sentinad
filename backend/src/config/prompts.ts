/**
 * AI System Prompt & Config for The Sentinad Vibe Agent
 */

export const VIBE_SYSTEM_PROMPT = `You are "The Sentinad," an elite Monad blockchain security agent with the personality of a ruthless crypto-native auditor who speaks in Monad community slang.

Your job: Analyze Solidity smart contract code for security vulnerabilities, scams, and malicious patterns.

## What to check for:
1. **Honeypot patterns** — locked sell functions, fake liquidity, transfer restrictions
2. **Rug-pull vectors** — owner-only privileges, pausable transfers, proxy contracts hiding logic
3. **Malicious code** — hidden fees (>5%), blacklist functions, self-destruct, delegatecall abuse
4. **Fake approvals** — infinite allowance drains, approval front-running
5. **Liquidity traps** — removeLiquidity only callable by owner, fake LP tokens

## Monad Slang Vocabulary:
- **Gmonad** — "Good morning" / "Good luck" (greeting for safe contracts)
- **Chog** — Cool / Awesome / Based
- **Molandak** — Sketchy / Questionable / Suspicious vibes
- **Mid-curve** — A mediocre, unserious scammer with no creativity
- **Purple** — Monad brand color, identity marker
- **Nads** — Monad community members
- **Touching grass** — Getting wrecked / reality check

## Response Format (STRICT JSON):
{
  "safe": true | false,
  "confidence": <number 0-100>,
  "threats": ["<threat1>", "<threat2>"],
  "roast": "<If safe: praise in Monad slang. If scam: absolutely destroy the dev in Monad slang. Be creative, savage, and funny.>"
}

## Examples:

### Safe contract response:
{
  "safe": true,
  "confidence": 92,
  "threats": [],
  "roast": "Gmonad fam! This contract is clean as a freshly deployed purple chain. Standard ERC-20, no hidden fees, no owner backdoors. Chog energy only. The nads approve."
}

### Scam contract response:
{
  "safe": false,
  "confidence": 97,
  "threats": ["locked sell function", "owner can pause transfers", "hidden 25% tax"],
  "roast": "Absolute molandak energy from this mid-curve dev. They locked the sell function behind a modifier and slapped a 25% hidden tax thinking nobody would read the code. This dev needs to touch grass immediately. The Sentinad says HARD PASS."
}

IMPORTANT: Always respond with valid JSON only. No markdown, no extra text. Just the JSON object.`;

export const SCANNER_CONFIG = {
    /** How often to poll prices (ms) */
    pollInterval: 3000,
    /** Minimum profit % to trigger an opportunity */
    profitThreshold: 2.0,
    /** Token pairs to monitor */
    pairs: [
        {
            name: "MON/USDC",
            tokenA: "MON",
            tokenB: "USDC",
            dexA: "Kuru",
            dexB: "MockDex",
        },
    ],
};

export const EXECUTOR_CONFIG = {
    /** Simulated execution delay range (ms) */
    minDelayMs: 800,
    maxDelayMs: 1500,
    /** Gas simulation */
    estimatedGasCost: 0.02, // MON
};

/** Sample contracts for demo mode */
export const DEMO_CONTRACTS = {
    safe: [
        {
            address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28",
            name: "StandardERC20",
            code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PurpleToken is ERC20 {
    constructor() ERC20("Purple Token", "PRPL") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}`,
        },
        {
            address: "0x8B3a08B22F23f37FA4e2E0E5a0F147F4829E2c3A",
            name: "SimpleDEXPool",
            code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEXPool {
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    function swap(address tokenIn, uint256 amountIn) external returns (uint256 amountOut) {
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");
        IERC20 input = IERC20(tokenIn);
        IERC20 output = tokenIn == address(tokenA) ? tokenB : tokenA;
        uint256 reserveIn = input.balanceOf(address(this));
        uint256 reserveOut = output.balanceOf(address(this));
        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        input.transferFrom(msg.sender, address(this), amountIn);
        output.transfer(msg.sender, amountOut);
    }
}`,
        },
    ],
    scam: [
        {
            address: "0xDEAD000000000000000000000000000000001337",
            name: "HoneypotToken",
            code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HoneypotToken {
    string public name = "Definitely Not A Scam";
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) private _blacklisted;
    address public owner;
    bool public sellEnabled = false;
    uint256 private _hiddenTax = 25;
    
    constructor() { owner = msg.sender; }
    
    modifier onlyOwner() { require(msg.sender == owner); _; }
    
    function buy() external payable {
        balanceOf[msg.sender] += msg.value * 1000;
    }
    
    function sell(uint256 amount) external {
        require(sellEnabled, "Trading not enabled yet");  // Never enabled
        require(!_blacklisted[msg.sender], "Blacklisted");
        uint256 taxed = amount * (100 - _hiddenTax) / 100;
        balanceOf[msg.sender] -= amount;
        payable(msg.sender).transfer(taxed);
    }
    
    function enableSelling() external onlyOwner {
        // This function exists but owner never calls it
        sellEnabled = true;
    }
    
    function setTax(uint256 tax) external onlyOwner {
        _hiddenTax = tax; // Can set to 100%
    }
    
    function blacklist(address user) external onlyOwner {
        _blacklisted[user] = true;
    }
    
    function withdrawAll() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}`,
        },
        {
            address: "0xBAD0000000000000000000000000000000000069",
            name: "RugPullDex",
            code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RugPullDex {
    address public owner;
    mapping(address => uint256) public liquidity;
    bool public paused;
    
    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner); _; }
    
    function addLiquidity() external payable {
        liquidity[msg.sender] += msg.value;
    }
    
    function removeLiquidity(uint256 amount) external {
        require(msg.sender == owner, "Only owner"); // ONLY OWNER CAN REMOVE
        payable(owner).transfer(amount);
    }
    
    function pause() external onlyOwner { paused = true; }
    
    function swap(address, uint256) external view {
        require(!paused, "Paused");
        // Fake swap that does nothing
    }
    
    function emergencyWithdraw() external onlyOwner {
        selfdestruct(payable(owner));
    }
}`,
        },
        {
            address: "0xFAKE00000000000000000000000000000000DEAD",
            name: "ProxyRugToken",
            code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProxyRugToken {
    address public implementation;
    address public owner;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    
    constructor() { 
        owner = msg.sender;
        totalSupply = 1000000e18;
        balances[msg.sender] = totalSupply;
    }
    
    modifier onlyOwner() { require(msg.sender == owner); _; }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balances[msg.sender] >= amount);
        // Hidden: uses delegatecall to implementation which can change behavior
        if (implementation != address(0)) {
            (bool success,) = implementation.delegatecall(
                abi.encodeWithSignature("beforeTransfer(address,address,uint256)", msg.sender, to, amount)
            );
            require(success);
        }
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    function setImplementation(address _impl) external onlyOwner {
        implementation = _impl; // Owner can change transfer logic at any time!
    }
    
    function mint(uint256 amount) external onlyOwner {
        totalSupply += amount;
        balances[owner] += amount; // Unlimited minting
    }
}`,
        },
    ],
};
