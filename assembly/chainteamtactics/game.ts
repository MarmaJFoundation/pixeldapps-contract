import { context, logging } from "near-sdk-as";
import { _onlyTestNet } from "../asserts";
import { AccountId, is_testnet_env } from "../utils";
import { CttAccountData, CttPlayerData } from "./helper/ctt_types";
import { cttPlayerRegistry } from "./helper/storage_manager";
import { ctt_custom_balance_of_impl } from "./helper/utils";

export function ctt_is_player_registered_impl(account_id: AccountId): bool {
    return cttPlayerRegistry.contains(account_id);
}

export function ctt_register_player_impl(): void {
    const account_id = context.predecessor;

    assert(account_id.length < 63 && (account_id.endsWith(".near") || account_id.endsWith(".testnet")), "Please use a .near account to play CTT.");
    assert(!cttPlayerRegistry.contains(account_id), "Wallet already registered");

    cttPlayerRegistry.set(account_id, new CttPlayerData());

    if (is_testnet_env()) {
        logging.log(`@${account_id} account has been created`);
    }
}

export function ctt_register_account_impl(account_id: string): void {
    assert(account_id.length < 63 && (account_id.endsWith(".near") || account_id.endsWith(".testnet")), "Please use a .near account to play CTT.");
    assert(!cttPlayerRegistry.contains(account_id), "Wallet already registered");

    cttPlayerRegistry.set(account_id, new CttPlayerData());

    if (is_testnet_env()) {
        logging.log(`@${account_id} account has been created`);
    }
}

export function ctt_unregister_player_impl(account_id: AccountId): void {
    _onlyTestNet();
    assert(cttPlayerRegistry.contains(account_id), "Wallet not found");
    // delete account
    cttPlayerRegistry.delete(account_id);
    logging.log(`@${account_id} account has been deleted`);

}

export function ctt_get_player_data_impl(account_id: AccountId): CttAccountData {
    const account_data = new CttAccountData();
    account_data.playerdata = cttPlayerRegistry.getSome(account_id);
    account_data.balance = ctt_custom_balance_of_impl(account_id);
    return account_data;
}