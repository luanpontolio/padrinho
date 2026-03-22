// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPadrinhoVault
/// @notice Interface for a Padrinho savings vault — an ERC-4626 vault where an afilhado
///         saves toward a target amount and an optional padrinho guards early withdrawals.
///
/// Storage layout (informational — implemented in PadrinhoVault):
///   address public afilhado            — the saver who owns the vault
///   address public padrinho            — the active guardian (address(0) if none)
///   address public pendingPadrinho     — invited but not yet accepted guardian
///   uint256 public targetAmount        — savings goal in USDC (6 decimals)
///   string  public objectiveName       — human-readable name for the objective
///   Status  public status              — Active | Completed
///   PadrinhoStatus public padrinhoStatus — None | Pending | Active
///   WithdrawalRequest public withdrawalRequest — current pending request (if any)
interface IPadrinhoVault {
    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    enum Status {
        Active,
        Completed
    }

    enum PadrinhoStatus {
        None,
        Pending,
        Active
    }

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    /// @notice Represents a pending early-withdrawal request from the afilhado.
    struct WithdrawalRequest {
        uint256 amount; // USDC amount requested (6 decimals)
        string message; // optional message to the padrinho
        bool exists; // true when a request is pending
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when the afilhado invites a padrinho.
    /// @param invited The wallet address of the invited padrinho.
    event PadrinhoInvited(address indexed invited);

    /// @notice Emitted when the invited padrinho accepts the role.
    /// @param padrinho The wallet address that accepted.
    event PadrinhoAccepted(address indexed padrinho);

    /// @notice Emitted when the padrinho resigns from the role.
    /// @param padrinho The wallet address that resigned.
    event PadrinhoResigned(address indexed padrinho);

    /// @notice Emitted when the afilhado cancels a pending invitation.
    event InviteCancelled();

    /// @notice Emitted on every successful USDC deposit.
    /// @param sender   The address that called deposit.
    /// @param assets   USDC amount deposited (6 decimals).
    /// @param newBalance Total vault balance after deposit.
    event Deposited(address indexed sender, uint256 assets, uint256 newBalance);

    /// @notice Emitted when the vault balance first reaches or exceeds targetAmount.
    /// @param balance The balance at the moment the goal was reached.
    event GoalReached(uint256 balance);

    /// @notice Emitted when the afilhado submits an early withdrawal request.
    /// @param amount  USDC amount requested.
    /// @param message Optional message to the padrinho.
    event WithdrawalRequested(uint256 amount, string message);

    /// @notice Emitted when the padrinho approves a withdrawal request.
    /// @param amount          USDC transferred to the afilhado.
    /// @param responseMessage Optional reply message from the padrinho.
    event WithdrawalApproved(uint256 amount, string responseMessage);

    /// @notice Emitted when the padrinho denies a withdrawal request.
    /// @param responseMessage Optional reply message from the padrinho.
    event WithdrawalDenied(string responseMessage);

    /// @notice Emitted when the afilhado withdraws the full balance after reaching the goal.
    /// @param amount USDC transferred to the afilhado.
    event GoalWithdrawn(uint256 amount);

    // -------------------------------------------------------------------------
    // Padrinho management
    // -------------------------------------------------------------------------

    /// @notice Invite a wallet address to become the padrinho for this objective.
    /// @dev Only callable by the afilhado. Reverts if invited == afilhado or if
    ///      a padrinho is already active.
    /// @param invited The wallet address to invite.
    function invitePadrinho(address invited) external;

    /// @notice Accept the padrinho invitation for this vault.
    /// @dev Only callable by pendingPadrinho. Sets padrinho = pendingPadrinho.
    function acceptInvite() external;

    /// @notice Cancel the pending padrinho invitation.
    /// @dev Only callable by the afilhado. Reverts if no pending invite exists.
    function cancelInvite() external;

    /// @notice Resign from the padrinho role.
    /// @dev Only callable by the active padrinho. Reverts if a withdrawal request
    ///      is pending.
    function resignPadrinho() external;

    // -------------------------------------------------------------------------
    // Deposits
    // -------------------------------------------------------------------------

    /// @notice Deposit USDC into the vault.
    /// @dev Overrides ERC-4626 deposit. Receiver MUST be the afilhado. Reverts if
    ///      status == Completed. Emits GoalReached if balance crosses targetAmount.
    /// @param assets   USDC amount to deposit (6 decimals).
    /// @param receiver Must equal afilhado.
    /// @return shares  ERC-4626 shares minted.
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    // -------------------------------------------------------------------------
    // Withdrawal — early request flow
    // -------------------------------------------------------------------------

    /// @notice Submit an early withdrawal request to the padrinho.
    /// @dev Only callable by the afilhado when status == Active and balance < targetAmount
    ///      and no pending request exists. In solo mode (no active padrinho) the
    ///      withdrawal executes immediately.
    /// @param amount  USDC amount to withdraw (6 decimals). Must be <= balance.
    /// @param message Optional message explaining the reason for early withdrawal.
    function requestWithdrawal(uint256 amount, string calldata message) external;

    /// @notice Approve the pending withdrawal request and transfer funds to the afilhado.
    /// @dev Only callable by the active padrinho.
    /// @param responseMessage Optional reply message to the afilhado.
    function approveWithdrawal(string calldata responseMessage) external;

    /// @notice Deny the pending withdrawal request. Funds remain in the vault.
    /// @dev Only callable by the active padrinho.
    /// @param responseMessage Optional reply message to the afilhado.
    function denyWithdrawal(string calldata responseMessage) external;

    // -------------------------------------------------------------------------
    // Withdrawal — goal reached
    // -------------------------------------------------------------------------

    /// @notice Withdraw the full balance once the goal is reached. No padrinho approval needed.
    /// @dev Only callable by the afilhado. Requires balance >= targetAmount.
    ///      Marks status = Completed after transfer.
    function withdrawGoal() external;

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice Returns the afilhado address.
    function afilhado() external view returns (address);

    /// @notice Returns the active padrinho address (address(0) if none).
    function padrinho() external view returns (address);

    /// @notice Returns the pending padrinho address (address(0) if none).
    function pendingPadrinho() external view returns (address);

    /// @notice Returns the savings target in USDC (6 decimals).
    function targetAmount() external view returns (uint256);

    /// @notice Returns the human-readable name of the objective.
    function objectiveName() external view returns (string memory);

    /// @notice Returns the current vault status.
    function status() external view returns (Status);

    /// @notice Returns the current padrinho status.
    function padrinhoStatus() external view returns (PadrinhoStatus);

    /// @notice Returns the current pending withdrawal request.
    function withdrawalRequest() external view returns (WithdrawalRequest memory);
}
