// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {PadrinhoVault} from "../../src/PadrinhoVault.sol";
import {IPadrinhoVault} from "../../src/interfaces/IPadrinhoVault.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

contract PadrinhoVaultTest is Test {
    MockUSDC internal usdc;
    PadrinhoVault internal vault;

    address internal afilhado = makeAddr("afilhado");
    address internal padrinho = makeAddr("padrinho");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant TARGET = 1000e6; // 1 000 USDC

    function setUp() public {
        usdc = new MockUSDC();
        vault = new PadrinhoVault(usdc, afilhado, TARGET, "Viagem", address(0));

        // Fund afilhado and stranger with USDC
        usdc.mint(afilhado, 10_000e6);
        usdc.mint(stranger, 10_000e6);

        // Approve vault to spend afilhado's USDC
        vm.prank(afilhado);
        usdc.approve(address(vault), type(uint256).max);
    }

    // -------------------------------------------------------------------------
    // Construction
    // -------------------------------------------------------------------------

    function test_constructor_setsFields() public view {
        assertEq(vault.afilhado(), afilhado);
        assertEq(vault.targetAmount(), TARGET);
        assertEq(vault.objectiveName(), "Viagem");
        assertEq(uint8(vault.status()), uint8(IPadrinhoVault.Status.Active));
        assertEq(uint8(vault.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.None));
    }

    function test_constructor_revertsOnZeroAfilhado() public {
        vm.expectRevert("PadrinhoVault: zero afilhado");
        new PadrinhoVault(usdc, address(0), TARGET, "X", address(0));
    }

    function test_constructor_revertsOnZeroTarget() public {
        vm.expectRevert("PadrinhoVault: zero target");
        new PadrinhoVault(usdc, afilhado, 0, "X", address(0));
    }

    // -------------------------------------------------------------------------
    // Invite padrinho
    // -------------------------------------------------------------------------

    function test_invitePadrinho_setsPendingAndEmits() public {
        vm.prank(afilhado);
        vm.expectEmit(true, false, false, false, address(vault));
        emit IPadrinhoVault.PadrinhoInvited(padrinho);
        vault.invitePadrinho(padrinho);

        assertEq(vault.pendingPadrinho(), padrinho);
        assertEq(uint8(vault.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.Pending));
    }

    function test_invitePadrinho_revertsIfNotAfilhado() public {
        vm.prank(stranger);
        vm.expectRevert("PadrinhoVault: not afilhado");
        vault.invitePadrinho(padrinho);
    }

    function test_invitePadrinho_revertsOnSelfInvite() public {
        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: cannot be own padrinho");
        vault.invitePadrinho(afilhado);
    }

    function test_invitePadrinho_revertsIfAlreadyActive() public {
        _activatePadrinho();
        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: padrinho already active");
        vault.invitePadrinho(stranger);
    }

    // -------------------------------------------------------------------------
    // Accept invite
    // -------------------------------------------------------------------------

    function test_acceptInvite_activatesPadrinhoAndEmits() public {
        vm.prank(afilhado);
        vault.invitePadrinho(padrinho);

        vm.prank(padrinho);
        vm.expectEmit(true, false, false, false, address(vault));
        emit IPadrinhoVault.PadrinhoAccepted(padrinho);
        vault.acceptInvite();

        assertEq(vault.padrinho(), padrinho);
        assertEq(vault.pendingPadrinho(), address(0));
        assertEq(uint8(vault.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.Active));
    }

    function test_acceptInvite_revertsIfNotPendingPadrinho() public {
        vm.prank(afilhado);
        vault.invitePadrinho(padrinho);

        vm.prank(stranger);
        vm.expectRevert("PadrinhoVault: not pending padrinho");
        vault.acceptInvite();
    }

    // -------------------------------------------------------------------------
    // Cancel invite
    // -------------------------------------------------------------------------

    function test_cancelInvite_clearsPendingAndEmits() public {
        vm.prank(afilhado);
        vault.invitePadrinho(padrinho);

        vm.prank(afilhado);
        vm.expectEmit(false, false, false, false, address(vault));
        emit IPadrinhoVault.InviteCancelled();
        vault.cancelInvite();

        assertEq(vault.pendingPadrinho(), address(0));
        assertEq(uint8(vault.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.None));
    }

    function test_cancelInvite_revertsIfNoPending() public {
        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: no pending invite");
        vault.cancelInvite();
    }

    // -------------------------------------------------------------------------
    // Resign padrinho
    // -------------------------------------------------------------------------

    function test_resignPadrinho_clearsAndEmits() public {
        _activatePadrinho();

        vm.prank(padrinho);
        vm.expectEmit(true, false, false, false, address(vault));
        emit IPadrinhoVault.PadrinhoResigned(padrinho);
        vault.resignPadrinho();

        assertEq(vault.padrinho(), address(0));
        assertEq(uint8(vault.padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.None));
    }

    function test_resignPadrinho_revertsWithPendingRequest() public {
        _activatePadrinho();
        _deposit(100e6);

        vm.prank(afilhado);
        vault.requestWithdrawal(50e6, "need it");

        vm.prank(padrinho);
        vm.expectRevert("PadrinhoVault: pending request exists");
        vault.resignPadrinho();
    }

    // -------------------------------------------------------------------------
    // Deposit
    // -------------------------------------------------------------------------

    function test_deposit_mintsSharesAndEmits() public {
        uint256 amount = 200e6;
        vm.prank(afilhado);
        vm.expectEmit(true, false, false, true, address(vault));
        emit IPadrinhoVault.Deposited(afilhado, amount, amount);
        vault.deposit(amount, afilhado);

        assertEq(vault.totalAssets(), amount);
    }

    function test_deposit_emitsGoalReachedWhenTargetMet() public {
        vm.prank(afilhado);
        vm.expectEmit(false, false, false, true, address(vault));
        emit IPadrinhoVault.GoalReached(TARGET);
        vault.deposit(TARGET, afilhado);
    }

    function test_deposit_revertsIfReceiverNotAfilhado() public {
        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: receiver must be afilhado");
        vault.deposit(100e6, stranger);
    }

    function test_deposit_revertsIfCompleted() public {
        _reachGoal();

        vm.prank(afilhado);
        vault.withdrawGoal();

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: objective completed");
        vault.deposit(100e6, afilhado);
    }

    function test_deposit_revertsOnZeroAmount() public {
        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: zero deposit");
        vault.deposit(0, afilhado);
    }

    // -------------------------------------------------------------------------
    // Request withdrawal — solo mode
    // -------------------------------------------------------------------------

    function test_requestWithdrawal_soloMode_executesImmediately() public {
        _deposit(300e6);
        uint256 balanceBefore = usdc.balanceOf(afilhado);

        vm.prank(afilhado);
        vault.requestWithdrawal(100e6, "");

        assertEq(usdc.balanceOf(afilhado), balanceBefore + 100e6);
    }

    // -------------------------------------------------------------------------
    // Request withdrawal — guarded mode
    // -------------------------------------------------------------------------

    function test_requestWithdrawal_guardedMode_createsPendingRequest() public {
        _activatePadrinho();
        _deposit(300e6);

        vm.prank(afilhado);
        vm.expectEmit(false, false, false, true, address(vault));
        emit IPadrinhoVault.WithdrawalRequested(100e6, "need it");
        vault.requestWithdrawal(100e6, "need it");

        IPadrinhoVault.WithdrawalRequest memory req = vault.withdrawalRequest();
        assertTrue(req.exists);
        assertEq(req.amount, 100e6);
    }

    function test_requestWithdrawal_revertsIfAlreadyPending() public {
        _activatePadrinho();
        _deposit(300e6);

        vm.prank(afilhado);
        vault.requestWithdrawal(50e6, "");

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: request already pending");
        vault.requestWithdrawal(50e6, "");
    }

    function test_requestWithdrawal_revertsIfAmountExceedsBalance() public {
        _deposit(100e6);

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: insufficient balance");
        vault.requestWithdrawal(200e6, "");
    }

    function test_requestWithdrawal_revertsIfGoalReached() public {
        _reachGoal();

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: goal reached, use withdrawGoal");
        vault.requestWithdrawal(100e6, "");
    }

    // -------------------------------------------------------------------------
    // Approve withdrawal
    // -------------------------------------------------------------------------

    function test_approveWithdrawal_transfersFundsAndEmits() public {
        _activatePadrinho();
        _deposit(300e6);
        uint256 balanceBefore = usdc.balanceOf(afilhado);

        vm.prank(afilhado);
        vault.requestWithdrawal(100e6, "need it");

        vm.prank(padrinho);
        vm.expectEmit(false, false, false, true, address(vault));
        emit IPadrinhoVault.WithdrawalApproved(100e6, "ok");
        vault.approveWithdrawal("ok");

        assertEq(usdc.balanceOf(afilhado), balanceBefore + 100e6);
        assertFalse(vault.withdrawalRequest().exists);
    }

    function test_approveWithdrawal_revertsIfNoPending() public {
        _activatePadrinho();

        vm.prank(padrinho);
        vm.expectRevert("PadrinhoVault: no pending request");
        vault.approveWithdrawal("");
    }

    function test_approveWithdrawal_revertsIfNotPadrinho() public {
        _activatePadrinho();
        _deposit(100e6);

        vm.prank(afilhado);
        vault.requestWithdrawal(50e6, "");

        vm.prank(stranger);
        vm.expectRevert("PadrinhoVault: not padrinho");
        vault.approveWithdrawal("");
    }

    // -------------------------------------------------------------------------
    // Deny withdrawal
    // -------------------------------------------------------------------------

    function test_denyWithdrawal_keepsFundsAndEmits() public {
        _activatePadrinho();
        _deposit(300e6);

        vm.prank(afilhado);
        vault.requestWithdrawal(100e6, "need it");

        uint256 vaultBalanceBefore = vault.totalAssets();

        vm.prank(padrinho);
        vm.expectEmit(false, false, false, true, address(vault));
        emit IPadrinhoVault.WithdrawalDenied("not now");
        vault.denyWithdrawal("not now");

        assertEq(vault.totalAssets(), vaultBalanceBefore);
        assertFalse(vault.withdrawalRequest().exists);
    }

    // -------------------------------------------------------------------------
    // Goal withdrawal
    // -------------------------------------------------------------------------

    function test_withdrawGoal_transfersFullBalanceAndCompletes() public {
        _reachGoal();
        uint256 balanceBefore = usdc.balanceOf(afilhado);

        vm.prank(afilhado);
        vm.expectEmit(false, false, false, true, address(vault));
        emit IPadrinhoVault.GoalWithdrawn(TARGET);
        vault.withdrawGoal();

        assertEq(usdc.balanceOf(afilhado), balanceBefore + TARGET);
        assertEq(uint8(vault.status()), uint8(IPadrinhoVault.Status.Completed));
    }

    function test_withdrawGoal_revertsIfGoalNotReached() public {
        _deposit(500e6);

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: goal not reached");
        vault.withdrawGoal();
    }

    function test_withdrawGoal_revertsIfCompleted() public {
        _reachGoal();

        vm.prank(afilhado);
        vault.withdrawGoal();

        vm.prank(afilhado);
        vm.expectRevert("PadrinhoVault: objective completed");
        vault.withdrawGoal();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function _activatePadrinho() internal {
        vm.prank(afilhado);
        vault.invitePadrinho(padrinho);
        vm.prank(padrinho);
        vault.acceptInvite();
    }

    function _deposit(uint256 amount) internal {
        vm.prank(afilhado);
        vault.deposit(amount, afilhado);
    }

    function _reachGoal() internal {
        _deposit(TARGET);
    }
}
