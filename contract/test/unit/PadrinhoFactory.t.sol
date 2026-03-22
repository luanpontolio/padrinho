// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../../lib/forge-std/src/Test.sol";
import {PadrinhoFactory} from "../../src/PadrinhoFactory.sol";
import {PadrinhoVault} from "../../src/PadrinhoVault.sol";
import {IPadrinhoVault} from "../../src/interfaces/IPadrinhoVault.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

contract PadrinhoFactoryTest is Test {
    MockUSDC internal usdc;
    PadrinhoFactory internal factory;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    function setUp() public {
        usdc = new MockUSDC();
        factory = new PadrinhoFactory(usdc);
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    function test_constructor_storesUsdc() public view {
        assertEq(address(factory.usdc()), address(usdc));
    }

    function test_constructor_revertsOnZeroUsdc() public {
        vm.expectRevert("PadrinhoFactory: zero usdc");
        new PadrinhoFactory(MockUSDC(address(0)));
    }

    // -------------------------------------------------------------------------
    // createObjective — without padrinho
    // -------------------------------------------------------------------------

    function test_createObjective_deploysVaultAndEmits() public {
        vm.prank(alice);
        vm.expectEmit(false, true, false, true);
        emit PadrinhoFactory.ObjectiveCreated(address(0), alice, 500e6, "Casa");
        address vault = factory.createObjective("Casa", 500e6, address(0));

        assertTrue(vault != address(0));
        assertEq(PadrinhoVault(vault).afilhado(), alice);
        assertEq(PadrinhoVault(vault).targetAmount(), 500e6);
        assertEq(PadrinhoVault(vault).objectiveName(), "Casa");
    }

    function test_createObjective_registersVaultForAfilhado() public {
        vm.prank(alice);
        address vault = factory.createObjective("Casa", 500e6, address(0));

        address[] memory vaults = factory.getObjectivesByAfilhado(alice);
        assertEq(vaults.length, 1);
        assertEq(vaults[0], vault);
    }

    function test_createObjective_multipleObjectivesForSameAfilhado() public {
        vm.startPrank(alice);
        factory.createObjective("Casa", 500e6, address(0));
        factory.createObjective("Carro", 200e6, address(0));
        factory.createObjective("Viagem", 300e6, address(0));
        vm.stopPrank();

        assertEq(factory.getObjectivesByAfilhado(alice).length, 3);
    }

    // -------------------------------------------------------------------------
    // createObjective — with padrinho hint
    // -------------------------------------------------------------------------

    function test_createObjective_withPadrinhoHint_invitesAndRegisters() public {
        vm.prank(alice);
        address vault = factory.createObjective("Casa", 500e6, bob);

        assertEq(PadrinhoVault(vault).pendingPadrinho(), bob);
        assertEq(uint8(PadrinhoVault(vault).padrinhoStatus()), uint8(IPadrinhoVault.PadrinhoStatus.Pending));

        address[] memory padrinhoVaults = factory.getObjectivesByPadrinho(bob);
        assertEq(padrinhoVaults.length, 1);
        assertEq(padrinhoVaults[0], vault);
    }

    function test_createObjective_withPadrinhoHint_emitsPadrinhoInvitedOnCreate() public {
        vm.prank(alice);
        // Event order: PadrinhoInvited (vault constructor) → ObjectiveCreated (factory) → PadrinhoInvitedOnCreate (factory)
        // vm.expectEmit matches as a subsequence, so we declare both factory events in order.
        vm.expectEmit(false, true, false, false);
        emit PadrinhoFactory.ObjectiveCreated(address(0), alice, 500e6, "Casa");
        vm.expectEmit(false, true, false, false);
        emit PadrinhoFactory.PadrinhoInvitedOnCreate(address(0), bob);
        factory.createObjective("Casa", 500e6, bob);
    }

    // -------------------------------------------------------------------------
    // Registry views
    // -------------------------------------------------------------------------

    function test_getObjectivesByAfilhado_emptyForUnknown() public view {
        assertEq(factory.getObjectivesByAfilhado(carol).length, 0);
    }

    function test_getObjectivesByPadrinho_emptyForUnknown() public view {
        assertEq(factory.getObjectivesByPadrinho(carol).length, 0);
    }

    function test_getObjectivesByPadrinho_multipleVaults() public {
        vm.prank(alice);
        factory.createObjective("Casa", 500e6, bob);
        vm.prank(carol);
        factory.createObjective("Carro", 200e6, bob);

        assertEq(factory.getObjectivesByPadrinho(bob).length, 2);
    }
}
