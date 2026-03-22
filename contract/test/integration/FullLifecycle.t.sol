// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../../lib/forge-std/src/Test.sol";
import {PadrinhoFactory} from "../../src/PadrinhoFactory.sol";
import {PadrinhoVault} from "../../src/PadrinhoVault.sol";
import {IPadrinhoVault} from "../../src/interfaces/IPadrinhoVault.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

/// @notice Integration tests covering end-to-end objective lifecycles.
contract FullLifecycleTest is Test {
    MockUSDC internal usdc;
    PadrinhoFactory internal factory;

    address internal alice = makeAddr("alice"); // afilhado
    address internal bob = makeAddr("bob"); // padrinho

    uint256 internal constant TARGET = 1000e6;

    function setUp() public {
        usdc = new MockUSDC();
        factory = new PadrinhoFactory(usdc);

        usdc.mint(alice, 10_000e6);

        vm.prank(alice);
        usdc.approve(address(factory), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // Path 1: Full accountability path
    //   create → invite → accept → deposit → request → approve → afilhado receives
    // -------------------------------------------------------------------------

    function test_accountabilityPath_fullHappyPath() public {
        // 1. Create with padrinho hint
        vm.prank(alice);
        address vault = factory.createObjective("Viagem", TARGET, bob);
        PadrinhoVault v = PadrinhoVault(vault);

        vm.prank(alice);
        usdc.approve(vault, type(uint256).max);

        // 2. Padrinho accepts
        vm.prank(bob);
        v.acceptInvite();
        assertEq(uint8(v.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.Active));

        // 3. Deposit 600 USDC
        vm.prank(alice);
        v.deposit(600e6, alice);
        assertEq(v.totalAssets(), 600e6);

        // 4. Alice requests early withdrawal
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        v.requestWithdrawal(200e6, "preciso pagar aluguel");

        // Funds still locked
        assertEq(v.totalAssets(), 600e6);
        assertTrue(v.withdrawalRequest().exists);

        // 5. Padrinho approves
        vm.prank(bob);
        v.approveWithdrawal("ok, vai la");

        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + 200e6);
        assertEq(v.totalAssets(), 400e6);
        assertFalse(v.withdrawalRequest().exists);
    }

    // -------------------------------------------------------------------------
    // Path 2: Solo path (no padrinho) — withdrawal executes immediately
    // -------------------------------------------------------------------------

    function test_soloPath_withdrawalExecutesWithoutApproval() public {
        vm.prank(alice);
        address vault = factory.createObjective("Carro", TARGET, address(0));
        PadrinhoVault v = PadrinhoVault(vault);

        vm.prank(alice);
        usdc.approve(vault, type(uint256).max);

        vm.prank(alice);
        v.deposit(500e6, alice);

        uint256 balanceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        v.requestWithdrawal(300e6, "");

        assertEq(usdc.balanceOf(alice), balanceBefore + 300e6);
        assertEq(v.totalAssets(), 200e6);
    }

    // -------------------------------------------------------------------------
    // Path 3: Goal reached — automatic free withdrawal, no padrinho needed
    // -------------------------------------------------------------------------

    function test_goalPath_afilhadoWithdrawsWithoutApproval() public {
        vm.prank(alice);
        address vault = factory.createObjective("Casa", TARGET, bob);
        PadrinhoVault v = PadrinhoVault(vault);

        vm.prank(alice);
        usdc.approve(vault, type(uint256).max);

        vm.prank(bob);
        v.acceptInvite();

        // Deposit exactly the target
        vm.prank(alice);
        v.deposit(TARGET, alice);
        assertEq(v.totalAssets(), TARGET);

        // Withdraw goal without padrinho approval
        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        v.withdrawGoal();

        assertEq(usdc.balanceOf(alice), balanceBefore + TARGET);
        assertEq(uint8(v.status()), uint8(IPadrinhoVault.Status.Completed));
    }

    // -------------------------------------------------------------------------
    // Path 4: Denial path — funds remain after padrinho denies
    // -------------------------------------------------------------------------

    function test_denialPath_fundsRemainAfterDeny() public {
        vm.prank(alice);
        address vault = factory.createObjective("Viagem", TARGET, bob);
        PadrinhoVault v = PadrinhoVault(vault);

        vm.prank(alice);
        usdc.approve(vault, type(uint256).max);

        vm.prank(bob);
        v.acceptInvite();

        vm.prank(alice);
        v.deposit(600e6, alice);

        vm.prank(alice);
        v.requestWithdrawal(300e6, "quero sacar");

        vm.prank(bob);
        v.denyWithdrawal("segura ai");

        assertEq(v.totalAssets(), 600e6);
        assertFalse(v.withdrawalRequest().exists);

        // Alice can submit a new request after denial
        vm.prank(alice);
        v.requestWithdrawal(100e6, "so 100 entao");
        assertTrue(v.withdrawalRequest().exists);
    }

    // -------------------------------------------------------------------------
    // Path 5: Completed objective is read-only
    // -------------------------------------------------------------------------

    function test_completedObjective_allActionsRevert() public {
        vm.prank(alice);
        address vault = factory.createObjective("Casa", TARGET, address(0));
        PadrinhoVault v = PadrinhoVault(vault);

        vm.prank(alice);
        usdc.approve(vault, type(uint256).max);

        vm.prank(alice);
        v.deposit(TARGET, alice);

        vm.prank(alice);
        v.withdrawGoal();

        // All mutations should revert
        vm.prank(alice);
        vm.expectRevert("PadrinhoVault: objective completed");
        v.deposit(1e6, alice);

        vm.prank(alice);
        vm.expectRevert("PadrinhoVault: objective completed");
        v.withdrawGoal();

        vm.prank(alice);
        vm.expectRevert("PadrinhoVault: objective completed");
        v.requestWithdrawal(1e6, "");
    }
}
