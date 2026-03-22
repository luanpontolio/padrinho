// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Minimal ERC-20 token with 6 decimals used as a USDC stand-in on Monad Testnet.
/// @dev Public mint with no access control — testnet only. DO NOT deploy to mainnet.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    /// @notice Returns 6 decimals to match real USDC.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address. No access control — testnet only.
    /// @param to     Recipient address.
    /// @param amount Amount in USDC base units (6 decimals).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
