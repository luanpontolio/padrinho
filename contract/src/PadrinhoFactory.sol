// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {PadrinhoVault} from "./PadrinhoVault.sol";

/// @title PadrinhoFactory
/// @notice Deploys one PadrinhoVault per objective and maintains a registry of vaults
///         indexed by afilhado and padrinho address.
contract PadrinhoFactory {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @notice The USDC token accepted by all vaults deployed from this factory.
    IERC20 public immutable usdc;

    /// @dev afilhado address => list of vault addresses
    mapping(address => address[]) private _vaultsByAfilhado;

    /// @dev padrinho address => list of vault addresses (populated on invite, not on accept)
    mapping(address => address[]) private _vaultsByPadrinho;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new objective vault is created.
    /// @param vault        Address of the newly deployed PadrinhoVault.
    /// @param afilhado     Address of the saver.
    /// @param targetAmount Savings goal in USDC (6 decimals).
    /// @param name         Human-readable objective name.
    event ObjectiveCreated(address indexed vault, address indexed afilhado, uint256 targetAmount, string name);

    /// @notice Emitted when a padrinho is invited during objective creation.
    /// @param vault    The vault where the invite was sent.
    /// @param padrinho The invited padrinho address.
    event PadrinhoInvitedOnCreate(address indexed vault, address indexed padrinho);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @param _usdc Address of the USDC token (6 decimals).
    constructor(IERC20 _usdc) {
        require(address(_usdc) != address(0), "PadrinhoFactory: zero usdc");
        usdc = _usdc;
    }

    // -------------------------------------------------------------------------
    // Core
    // -------------------------------------------------------------------------

    /// @notice Create a new savings objective. Optionally invite a padrinho in the same tx.
    /// @param name          Human-readable name for the objective.
    /// @param targetAmount  Savings goal in USDC base units (6 decimals).
    /// @param padrinhoHint  Optional padrinho address; pass address(0) to skip.
    /// @return vault        Address of the deployed PadrinhoVault.
    function createObjective(string calldata name, uint256 targetAmount, address padrinhoHint)
        external
        returns (address vault)
    {
        // padrinhoHint is passed to the constructor — the vault sets pendingPadrinho
        // directly, avoiding a separate invitePadrinho call that would require
        // msg.sender == afilhado (which would be the factory, not the user).
        PadrinhoVault v = new PadrinhoVault(usdc, msg.sender, targetAmount, name, padrinhoHint);
        vault = address(v);

        _vaultsByAfilhado[msg.sender].push(vault);
        emit ObjectiveCreated(vault, msg.sender, targetAmount, name);

        if (padrinhoHint != address(0)) {
            _vaultsByPadrinho[padrinhoHint].push(vault);
            emit PadrinhoInvitedOnCreate(vault, padrinhoHint);
        }
    }

    // -------------------------------------------------------------------------
    // Registry views
    // -------------------------------------------------------------------------

    /// @notice Returns all vault addresses created by a given afilhado.
    /// @param _afilhado The saver's wallet address.
    function getObjectivesByAfilhado(address _afilhado) external view returns (address[] memory) {
        return _vaultsByAfilhado[_afilhado];
    }

    /// @notice Returns all vault addresses where the given address was invited as padrinho.
    /// @dev Populated at invite time (createObjective with padrinhoHint). Does not update
    ///      on post-creation invites via PadrinhoVault.invitePadrinho directly.
    /// @param _padrinho The padrinho's wallet address.
    function getObjectivesByPadrinho(address _padrinho) external view returns (address[] memory) {
        return _vaultsByPadrinho[_padrinho];
    }
}
