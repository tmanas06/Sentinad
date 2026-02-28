// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Arbiter — The Sentinad Flash Arb Engine
 * @notice Executes atomic flash arbitrage between two DEXs on Monad.
 *         Borrows from DEX A, swaps on DEX B at a higher price, repays, keeps profit.
 * @dev    For hackathon/testnet demo. Uses a simplified swap interface.
 */

/// @notice Minimal ERC-20 interface for token transfers
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Minimal DEX router interface (Uniswap V2 style)
interface IDexRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

/// @notice Minimal flash loan provider interface
interface IFlashLoanProvider {
    function flashLoan(
        address borrower,
        address token,
        uint256 amount,
        bytes calldata data
    ) external;
}

contract Arbiter {
    address public owner;
    bool private locked;

    // --- Events ---
    event ArbitrageExecuted(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountBorrowed,
        uint256 profit,
        uint256 timestamp
    );
    event ArbitrageFailed(string reason);
    event ProfitWithdrawn(address indexed token, uint256 amount);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Arbiter: not owner");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "Arbiter: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Initiate flash arbitrage between two DEX routers
     * @param flashProvider  The flash loan provider address
     * @param routerA        DEX router to buy from (cheaper)
     * @param routerB        DEX router to sell on (more expensive)
     * @param tokenA         The borrowed / base token
     * @param tokenB         The intermediary token for the swap
     * @param borrowAmount   Amount of tokenA to flash borrow
     * @param minProfit      Minimum profit in tokenA required (reverts if not met)
     */
    function executeArbitrage(
        address flashProvider,
        address routerA,
        address routerB,
        address tokenA,
        address tokenB,
        uint256 borrowAmount,
        uint256 minProfit
    ) external onlyOwner noReentrancy {
        bytes memory data = abi.encode(
            routerA,
            routerB,
            tokenA,
            tokenB,
            borrowAmount,
            minProfit
        );

        IFlashLoanProvider(flashProvider).flashLoan(
            address(this),
            tokenA,
            borrowAmount,
            data
        );
    }

    /**
     * @notice Flash loan callback — called by the flash loan provider
     * @dev    Executes the two-leg swap and ensures profit covers repayment
     */
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        require(initiator == address(this), "Arbiter: invalid initiator");

        (
            address routerA,
            address routerB,
            address tokenA,
            address tokenB,
            uint256 borrowAmount,
            uint256 minProfit
        ) = abi.decode(data, (address, address, address, address, uint256, uint256));

        uint256 balanceBefore = IERC20(tokenA).balanceOf(address(this));

        // --- Leg 1: Buy tokenB on DEX A (the cheaper one) ---
        IERC20(tokenA).approve(routerA, borrowAmount);
        address[] memory pathBuy = new address[](2);
        pathBuy[0] = tokenA;
        pathBuy[1] = tokenB;
        IDexRouter(routerA).swapExactTokensForTokens(
            borrowAmount,
            0, // accept any amount (slippage handled by minProfit)
            pathBuy,
            address(this),
            block.timestamp + 120
        );

        // --- Leg 2: Sell tokenB on DEX B (the more expensive one) ---
        uint256 tokenBBalance = IERC20(tokenB).balanceOf(address(this));
        IERC20(tokenB).approve(routerB, tokenBBalance);
        address[] memory pathSell = new address[](2);
        pathSell[0] = tokenB;
        pathSell[1] = tokenA;
        IDexRouter(routerB).swapExactTokensForTokens(
            tokenBBalance,
            0,
            pathSell,
            address(this),
            block.timestamp + 120
        );

        // --- Repay flash loan ---
        uint256 repayAmount = amount + fee;
        uint256 balanceAfter = IERC20(tokenA).balanceOf(address(this));
        uint256 profit = balanceAfter - balanceBefore - fee;

        require(profit >= minProfit, "Arbiter: profit below minimum");

        IERC20(token).approve(msg.sender, repayAmount);

        emit ArbitrageExecuted(tokenA, tokenB, borrowAmount, profit, block.timestamp);

        return keccak256("FlashLoan");
    }

    /**
     * @notice Withdraw accumulated profits to the owner wallet
     */
    function withdrawProfit(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Arbiter: no profit to withdraw");
        IERC20(token).transfer(owner, balance);
        emit ProfitWithdrawn(token, balance);
    }

    /**
     * @notice Read the estimated output for a swap on a given router
     */
    function getQuote(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        uint256[] memory amounts = IDexRouter(router).getAmountsOut(amountIn, path);
        return amounts[1];
    }

    /**
     * @notice Emergency: transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Arbiter: zero address");
        owner = newOwner;
    }

    receive() external payable {}
}
