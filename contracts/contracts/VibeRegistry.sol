// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VibeRegistry — On-chain Roast Log
 * @notice Permanently records AI "vibe check" results and roasts for audited contracts.
 *         A public hall of shame (or hall of fame) for the Monad ecosystem.
 */
contract VibeRegistry {
    struct VibeCheck {
        address contractAddress;
        bool safe;
        uint8 confidence;       // 0-100
        string roast;
        uint256 timestamp;
        address submitter;
    }

    // --- Storage ---
    VibeCheck[] public vibeChecks;
    mapping(address => uint256[]) public checksByContract;
    address public owner;

    // --- Events ---
    event VibeCheckRecorded(
        uint256 indexed checkId,
        address indexed contractAddress,
        bool safe,
        uint8 confidence,
        string roast,
        address submitter
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "VibeRegistry: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Record a new vibe check result on-chain
     * @param contractAddr  The audited contract address
     * @param safe          Whether the contract passed the vibe check
     * @param confidence    AI confidence score (0-100)
     * @param roast         The AI-generated roast or approval message
     */
    function recordVibeCheck(
        address contractAddr,
        bool safe,
        uint8 confidence,
        string calldata roast
    ) external onlyOwner {
        uint256 checkId = vibeChecks.length;
        vibeChecks.push(VibeCheck({
            contractAddress: contractAddr,
            safe: safe,
            confidence: confidence,
            roast: roast,
            timestamp: block.timestamp,
            submitter: msg.sender
        }));
        checksByContract[contractAddr].push(checkId);

        emit VibeCheckRecorded(
            checkId,
            contractAddr,
            safe,
            confidence,
            roast,
            msg.sender
        );
    }

    /**
     * @notice Get the total number of recorded vibe checks
     */
    function getTotalChecks() external view returns (uint256) {
        return vibeChecks.length;
    }

    /**
     * @notice Get all check IDs for a specific contract
     */
    function getChecksByContract(address contractAddr) external view returns (uint256[] memory) {
        return checksByContract[contractAddr];
    }

    /**
     * @notice Get the latest vibe check for a contract
     */
    function getLatestCheck(address contractAddr) external view returns (VibeCheck memory) {
        uint256[] memory ids = checksByContract[contractAddr];
        require(ids.length > 0, "VibeRegistry: no checks found");
        return vibeChecks[ids[ids.length - 1]];
    }

    /**
     * @notice Get a batch of vibe checks (for gallery pagination)
     * @param offset  Start index
     * @param limit   Max number of results
     */
    function getVibeChecks(uint256 offset, uint256 limit) external view returns (VibeCheck[] memory) {
        uint256 total = vibeChecks.length;
        if (offset >= total) {
            return new VibeCheck[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;

        VibeCheck[] memory result = new VibeCheck[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = vibeChecks[offset + i];
        }
        return result;
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "VibeRegistry: zero address");
        owner = newOwner;
    }
}
