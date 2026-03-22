// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../../lib/forge-std/src/Test.sol";
import {PadrinhoVault} from "../../src/PadrinhoVault.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

/// @notice Handler that drives random interactions for the invariant test.
contract VaultHandler is Test {
    PadrinhoVault public vault;
    MockUSDC public usdc;
    address public afilhado;
    address public padrinho;

    constructor(PadrinhoVault _vault, MockUSDC _usdc, address _afilhado, address _padrinho) {
        vault = _vault;
        usdc = _usdc;
        afilhado = _afilhado;
        padrinho = _padrinho;
    }

    function deposit(uint64 amount) external {
        amount = uint64(bound(amount, 1, 100_000e6));
        usdc.mint(afilhado, amount);
        vm.prank(afilhado);
        usdc.approve(address(vault), amount);
        vm.prank(afilhado);
        try vault.deposit(amount, afilhado) {} catch {}
    }

    function requestWithdrawal(uint64 amount) external {
        uint256 balance = vault.totalAssets();
        if (balance == 0) return;
        amount = uint64(bound(amount, 1, balance));
        vm.prank(afilhado);
        try vault.requestWithdrawal(amount, "") {} catch {}
    }

    function approveWithdrawal() external {
        vm.prank(padrinho);
        try vault.approveWithdrawal("") {} catch {}
    }

    function denyWithdrawal() external {
        vm.prank(padrinho);
        try vault.denyWithdrawal("") {} catch {}
    }
}

contract VaultInvariantTest is Test {
    MockUSDC internal usdc;
    PadrinhoVault internal vault;
    VaultHandler internal handler;

    address internal afilhado = makeAddr("afilhado");
    address internal padrinho = makeAddr("padrinho");

    function setUp() public {
        usdc = new MockUSDC();
        vault = new PadrinhoVault(usdc, afilhado, 1_000e6, "Invariant", address(0));

        // Activate padrinho so handler can drive both guarded and solo paths
        vm.prank(afilhado);
        vault.invitePadrinho(padrinho);
        vm.prank(padrinho);
        vault.acceptInvite();

        handler = new VaultHandler(vault, usdc, afilhado, padrinho);

        targetContract(address(handler));
    }

    /// @notice Core accounting invariant:
    ///         vault.totalAssets() MUST always equal the actual USDC balance held by the vault.
    function invariant_totalAssetsEqualUsdcBalance() public view {
        assertEq(vault.totalAssets(), usdc.balanceOf(address(vault)));
    }

    /// @notice Share supply sanity: if totalAssets == 0 then totalSupply (shares) == 0.
    function invariant_zeroAssetsImpliesZeroShares() public view {
        if (vault.totalAssets() == 0) {
            assertEq(vault.totalSupply(), 0);
        }
    }
}
