// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IPadrinhoVault} from "./interfaces/IPadrinhoVault.sol";

/// @title PadrinhoVault
/// @notice ERC-4626 savings vault where an afilhado saves toward a goal and an optional
///         padrinho guards early withdrawals.
///
/// @dev Checks-Effects-Interactions (CEI) is followed throughout. The only deviation is
///      inside ERC-4626's inherited `_withdraw`, which burns shares after the asset
///      transfer per the standard. ReentrancyGuard is applied as a compensating control
///      (see plan Complexity Tracking).
contract PadrinhoVault is ERC4626, ReentrancyGuard, IPadrinhoVault {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    address public override afilhado;
    address public override padrinho;
    address public override pendingPadrinho;
    uint256 public override targetAmount;
    string public override objectiveName;
    Status public override status;
    PadrinhoStatus public override padrinhoStatus;
    WithdrawalRequest private _withdrawalRequest;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @param usdc           The USDC token address (6 decimals).
    /// @param _afilhado      Address of the saver who owns this vault.
    /// @param _targetAmount  Savings goal in USDC base units (6 decimals).
    /// @param _name          Human-readable name for the objective.
    /// @param _padrinhoHint  Optional padrinho address to invite at construction time;
    ///                       pass address(0) to skip. Bypasses onlyAfilhado because the
    ///                       deployer (factory) acts on behalf of the afilhado.
    constructor(IERC20 usdc, address _afilhado, uint256 _targetAmount, string memory _name, address _padrinhoHint)
        ERC4626(usdc)
        ERC20(string.concat("Padrinho ", _name, " Shares"), string.concat("pPAD-", _name))
    {
        require(_afilhado != address(0), "PadrinhoVault: zero afilhado");
        require(_targetAmount > 0, "PadrinhoVault: zero target");
        require(_padrinhoHint != _afilhado, "PadrinhoVault: cannot be own padrinho");

        afilhado = _afilhado;
        targetAmount = _targetAmount;
        objectiveName = _name;
        status = Status.Active;
        padrinhoStatus = PadrinhoStatus.None;

        if (_padrinhoHint != address(0)) {
            pendingPadrinho = _padrinhoHint;
            padrinhoStatus = PadrinhoStatus.Pending;
            emit PadrinhoInvited(_padrinhoHint);
        }
    }

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyAfilhado() {
        require(msg.sender == afilhado, "PadrinhoVault: not afilhado");
        _;
    }

    modifier onlyPadrinho() {
        require(msg.sender == padrinho, "PadrinhoVault: not padrinho");
        _;
    }

    modifier onlyActive() {
        require(status == Status.Active, "PadrinhoVault: objective completed");
        _;
    }

    // -------------------------------------------------------------------------
    // Padrinho management
    // -------------------------------------------------------------------------

    /// @inheritdoc IPadrinhoVault
    function invitePadrinho(address invited) external override onlyAfilhado {
        require(invited != address(0), "PadrinhoVault: zero address");
        require(invited != afilhado, "PadrinhoVault: cannot be own padrinho");
        require(padrinhoStatus != PadrinhoStatus.Active, "PadrinhoVault: padrinho already active");

        pendingPadrinho = invited;
        padrinhoStatus = PadrinhoStatus.Pending;

        emit PadrinhoInvited(invited);
    }

    /// @inheritdoc IPadrinhoVault
    function acceptInvite() external override {
        require(msg.sender == pendingPadrinho, "PadrinhoVault: not pending padrinho");

        // Effects
        padrinho = pendingPadrinho;
        pendingPadrinho = address(0);
        padrinhoStatus = PadrinhoStatus.Active;

        emit PadrinhoAccepted(padrinho);
    }

    /// @inheritdoc IPadrinhoVault
    function cancelInvite() external override onlyAfilhado {
        require(padrinhoStatus == PadrinhoStatus.Pending, "PadrinhoVault: no pending invite");

        pendingPadrinho = address(0);
        padrinhoStatus = PadrinhoStatus.None;

        emit InviteCancelled();
    }

    /// @inheritdoc IPadrinhoVault
    function resignPadrinho() external override onlyPadrinho {
        require(!_withdrawalRequest.exists, "PadrinhoVault: pending request exists");

        padrinho = address(0);
        padrinhoStatus = PadrinhoStatus.None;

        emit PadrinhoResigned(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Deposits
    // -------------------------------------------------------------------------

    /// @inheritdoc IPadrinhoVault
    /// @dev Overrides ERC-4626 deposit. Receiver must be the afilhado.
    function deposit(uint256 assets, address receiver)
        public
        override(ERC4626, IPadrinhoVault)
        nonReentrant
        onlyActive
        returns (uint256 shares)
    {
        require(receiver == afilhado, "PadrinhoVault: receiver must be afilhado");
        require(assets > 0, "PadrinhoVault: zero deposit");

        shares = super.deposit(assets, receiver);

        uint256 newBalance = totalAssets();
        emit Deposited(msg.sender, assets, newBalance);

        if (newBalance >= targetAmount) {
            emit GoalReached(newBalance);
        }
    }

    // -------------------------------------------------------------------------
    // Withdrawals
    // -------------------------------------------------------------------------

    /// @inheritdoc IPadrinhoVault
    function requestWithdrawal(uint256 amount, string calldata message)
        external
        override
        nonReentrant
        onlyAfilhado
        onlyActive
    {
        require(amount > 0, "PadrinhoVault: zero amount");
        require(amount <= totalAssets(), "PadrinhoVault: insufficient balance");
        require(totalAssets() < targetAmount, "PadrinhoVault: goal reached, use withdrawGoal");

        // Solo mode: no active padrinho — execute immediately
        if (padrinhoStatus != PadrinhoStatus.Active) {
            _executeWithdrawal(amount);
            return;
        }

        require(!_withdrawalRequest.exists, "PadrinhoVault: request already pending");

        // Effects
        _withdrawalRequest = WithdrawalRequest({amount: amount, message: message, exists: true});

        emit WithdrawalRequested(amount, message);
    }

    /// @inheritdoc IPadrinhoVault
    function approveWithdrawal(string calldata responseMessage) external override nonReentrant onlyPadrinho {
        require(_withdrawalRequest.exists, "PadrinhoVault: no pending request");

        uint256 amount = _withdrawalRequest.amount;

        // Effects before interaction (compensating for ERC-4626 CEI deviation)
        delete _withdrawalRequest;

        emit WithdrawalApproved(amount, responseMessage);

        // Interaction
        _executeWithdrawal(amount);
    }

    /// @inheritdoc IPadrinhoVault
    function denyWithdrawal(string calldata responseMessage) external override onlyPadrinho {
        require(_withdrawalRequest.exists, "PadrinhoVault: no pending request");

        // Effects
        delete _withdrawalRequest;

        emit WithdrawalDenied(responseMessage);
    }

    /// @inheritdoc IPadrinhoVault
    function withdrawGoal() external override nonReentrant onlyAfilhado onlyActive {
        uint256 balance = totalAssets();
        require(balance >= targetAmount, "PadrinhoVault: goal not reached");

        // Effects
        status = Status.Completed;

        emit GoalWithdrawn(balance);

        // Interaction — redeem all shares
        uint256 shares = balanceOf(afilhado);
        _withdraw(afilhado, afilhado, afilhado, balance, shares);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @inheritdoc IPadrinhoVault
    function withdrawalRequest() external view override returns (WithdrawalRequest memory) {
        return _withdrawalRequest;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /// @dev Converts amount to shares and redeems them to the afilhado.
    ///      Always uses afilhado as caller/receiver/owner so no share allowance is needed,
    ///      regardless of who triggered the withdrawal (afilhado solo or padrinho approve).
    function _executeWithdrawal(uint256 amount) internal {
        uint256 shares = previewWithdraw(amount);
        _withdraw(afilhado, afilhado, afilhado, amount, shares);
    }
}
