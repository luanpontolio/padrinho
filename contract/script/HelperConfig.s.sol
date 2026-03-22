// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "../lib/forge-std/src/Script.sol";

/// @title HelperConfig
/// @notice Returns chain-aware deployment addresses.
///         On Monad Testnet (10143) MockUSDC is deployed by Deploy.s.sol and its
///         address is passed in at construction time.
contract HelperConfig is Script {
    struct NetworkConfig {
        address usdc;
    }

    NetworkConfig public activeConfig;

    /// @param mockUsdcAddress Address of the deployed MockUSDC (only used on testnet).
    constructor(address mockUsdcAddress) {
        if (block.chainid == 10143) {
            activeConfig = NetworkConfig({usdc: mockUsdcAddress});
        } else {
            // Local anvil — deploy a fresh MockUSDC inline via vm.deployCode if needed,
            // or supply address(0) and let tests handle it.
            activeConfig = NetworkConfig({usdc: mockUsdcAddress});
        }
    }
}
