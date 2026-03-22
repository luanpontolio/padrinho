import { parseAbiItem } from "viem";

export const EV_DEPOSITED = parseAbiItem(
  "event Deposited(address indexed sender, uint256 assets, uint256 newBalance)",
);

export const EV_WITHDRAWAL_REQUESTED = parseAbiItem(
  "event WithdrawalRequested(uint256 amount, string message)",
);

export const EV_WITHDRAWAL_APPROVED = parseAbiItem(
  "event WithdrawalApproved(uint256 amount, string responseMessage)",
);

export const EV_WITHDRAWAL_DENIED = parseAbiItem(
  "event WithdrawalDenied(string responseMessage)",
);

export const EV_GOAL_WITHDRAWN = parseAbiItem(
  "event GoalWithdrawn(uint256 amount)",
);
