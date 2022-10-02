import { logging } from "near-sdk-as";
import { _onlyPxDapps } from "../asserts";
import { ft_transfer_internal_impl } from "../nep/141";
import { AccountId, BANK_ACCOUNT, toYoctoToken } from "../utils";
import { CttBetTierTypes, CttFightResult } from "./helper/ctt_types";
import { cttPlayerRegistry } from "./helper/storage_manager";
import { CTT_FIGHT_WINNER_PRIZES, CTT_TAX_CREATE_OR_JOIN_FIGHTS } from "./helper/utils";

export function ctt_create_or_join_fight_impl(account_id: AccountId, bet_type: CttBetTierTypes): void {
    _onlyPxDapps();

    const index = i32(bet_type);
    const amount_converted = toYoctoToken(CTT_TAX_CREATE_OR_JOIN_FIGHTS[index]);

    logging.log("Fee: " + amount_converted.toString());
    ft_transfer_internal_impl(account_id, BANK_ACCOUNT, amount_converted.toString(), null);
}

export function ctt_refund_room_players_impl(account_ids: AccountId[], bet_type: CttBetTierTypes): void {
    _onlyPxDapps();

    const index = i32(bet_type);
    const amount_converted = toYoctoToken(CTT_TAX_CREATE_OR_JOIN_FIGHTS[index]);

    for (let i: i32 = 0; i < account_ids.length; i++) {
        const account_id: AccountId = account_ids[i];

        logging.log(`Refund ${amount_converted} to ${account_id}`);
        ft_transfer_internal_impl(BANK_ACCOUNT, account_id, amount_converted.toString(), null);
    }
}

export function ctt_save_fight_result_impl(result: CttFightResult): void {
    _onlyPxDapps();

   // ctt_update_player_impl(result.winner_id, result.winner_rating_change, true);
   // ctt_update_player_impl(result.loser_id, result.loser_rating_change, false);

    const index = i32(result.bet_type);
    const amount_converted = toYoctoToken(CTT_FIGHT_WINNER_PRIZES[index]);

    logging.log(`Send ${amount_converted} to ${result.winner_id}`);
    ft_transfer_internal_impl(BANK_ACCOUNT, result.winner_id, amount_converted.toString(), null);
}