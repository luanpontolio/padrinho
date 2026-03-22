// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {PadrinhoFactory} from "../src/PadrinhoFactory.sol";

/// @title Deploy
/// @notice Deploys MockUSDC then PadrinhoFactory to Monad Testnet.
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url $RPC_URL --account <keystore-account> --broadcast
///
/// Deployment order:
///   1. MockUSDC    — testnet stand-in for USDC (6 decimals, public mint)
///   2. PadrinhoFactory(mockUsdc) — factory that deploys one vault per objective
contract Deploy is Script {
    function run() external returns (MockUSDC mockUsdc, PadrinhoFactory factory) {
        vm.startBroadcast();

        // 1. Deploy MockUSDC
        mockUsdc = new MockUSDC();
        console.log("MockUSDC deployed at:      ", address(mockUsdc));

        // 2. Deploy PadrinhoFactory, passing MockUSDC as the underlying asset
        factory = new PadrinhoFactory(mockUsdc);
        console.log("PadrinhoFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
