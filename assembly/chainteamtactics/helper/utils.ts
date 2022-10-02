import { ft_balance_of_impl } from "../../nep/141";
import { nft_supply_for_owner_impl } from "./ctt_nep";
import { PxBalanceCTT } from "./ctt_types";

export const CTT_FIGHT_WINNER_PRIZES: string[] = ["9", "95", "450"];
export const CTT_TAX_CREATE_OR_JOIN_FIGHTS: string[] = ["5", "50", "500"];

export const CTT_MAX_UNITS_COUNT: i32 = 20;

export function ctt_custom_balance_of_impl(account_id: string): PxBalanceCTT {
    const returnBalance = new PxBalanceCTT(ft_balance_of_impl(account_id), "0");
    returnBalance.tokens = nft_supply_for_owner_impl(account_id);
    return returnBalance;
}