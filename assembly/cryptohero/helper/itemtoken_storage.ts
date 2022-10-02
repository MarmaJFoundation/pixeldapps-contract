import { context, logging, storage, u128 } from "near-sdk-core";
import { _onlyPxDapps, _onlyTestNet } from "../../asserts";
import { AccountId, is_testnet_env, randomNumber, TokenId } from "../../utils";
import { ChItemToken, ChItemType, ChRarityType } from "./ch_types";
import { chItemTokenRegistry, chPlayerRegistry } from "./storage_manager";
import { CH_MAX_ITEMS_COUNT } from "./utils";

function get_itemtoken_count_and_increase(): u32 {
    const counter_key: string = "ch_token_count";
    const count = storage.getPrimitive<u32>(counter_key, 0);
    storage.set(counter_key, count + 1);
    return count;
}

export function ch_get_items_by_ids_impl(token_ids: TokenId[]): ChItemToken[] {
    const item_tokens: ChItemToken[] = new Array<ChItemToken>(token_ids.length);
    for (let i: i32 = 0; i < token_ids.length; i++) {
        item_tokens[i] = chItemTokenRegistry.getSome(token_ids[i]);
    }
    return item_tokens;
}

export function ch_delete_item_impl(token_id: TokenId): void {
    const item_token = chItemTokenRegistry.getSome(token_id);
    const account_id = context.predecessor;

    assert(item_token.owner == account_id, "You don't own this item");
    assert(item_token.price == u128.Zero, "You can't delete an item for sale");

    remove_item_from_player(account_id, token_id);
    chItemTokenRegistry.delete(token_id);

    if (is_testnet_env()) {
        logging.log(`@${account_id} deleted item #${token_id}`);
    }
}

export function ch_create_item(receiver_id: AccountId, item_token: ChItemToken): TokenId {
    ch_ensure_items_threshold(receiver_id);

    const token_id = get_itemtoken_count_and_increase().toString();
    item_token.token_id = token_id;
    chItemTokenRegistry.set(token_id, item_token);

    if (is_testnet_env()) {
        logging.log(`created item #${token_id}`);
    }

    add_item_to_player(receiver_id, token_id);
    return token_id;
}

function add_item_to_player(account_id: AccountId, token_id: TokenId): ChItemToken {
    const player_data = chPlayerRegistry.getSome(account_id);
    const item_token = chItemTokenRegistry.getSome(token_id);

    player_data.item_ids.push(item_token.token_id);
    chPlayerRegistry.set(account_id, player_data);

    item_token.owner = account_id;
    item_token.price = u128.Zero;
    chItemTokenRegistry.set(item_token.token_id, item_token);

    if (is_testnet_env()) {
        logging.log(`added item #${token_id} to @${account_id}`);
    }

    return item_token;
}

function remove_item_from_player(account_id: AccountId, token_id: TokenId): void {
    const player_data = chPlayerRegistry.getSome(account_id);
    const index = player_data.item_ids.indexOf(token_id);

    assert(index != -1, "You don't own this item");

    player_data.item_ids.splice(index, 1);
    chPlayerRegistry.set(account_id, player_data);

    if (is_testnet_env()) {
        logging.log(`removed item #${token_id} from @${account_id}`);
    }
}

export function ch_transfer_item(sender_id: AccountId, receiver_id: AccountId, token_id: TokenId): void {
    remove_item_from_player(sender_id, token_id);
    add_item_to_player(receiver_id, token_id);

    if (is_testnet_env()) {
        logging.log(`transferred item #${token_id} from @${sender_id} to @${receiver_id}`);
    }
}

export function ch_ensure_items_threshold(account_id: AccountId, item_count: u32 = 1): void {
    assert(item_count > 0, "Item count should be higher than zero");
    const player_data = chPlayerRegistry.getSome(account_id);
    assert(player_data.item_ids.length + (item_count - 1) < CH_MAX_ITEMS_COUNT, `You can only own ${CH_MAX_ITEMS_COUNT} items at the same time`);
}

export function ch_generate_item_token(item_type: ChItemType, rarity_type: ChRarityType): ChItemToken {
    const rarity_stats: u32[] = ChRarityBaseStats[rarity_type];
    const stats_penalty: i32[] = [10, 50];

    let strength: i32 = i32(randomNumber(rarity_stats[0], rarity_stats[1] - 1));
    let endurance: i32 = i32(randomNumber(rarity_stats[0], rarity_stats[1] - 1));
    let dexterity: i32 = i32(randomNumber(rarity_stats[0], rarity_stats[1] - 1));
    let intelligence: i32 = i32(randomNumber(rarity_stats[0], rarity_stats[1] - 1));
    let luck: i32 = i32(randomNumber(rarity_stats[0], rarity_stats[1] - 1));

    for (let i: i32 = 0; i < 10; i++) {
        if ((strength + endurance + dexterity + intelligence + luck) > i32(rarity_stats[1])) {
            strength -= i32(randomNumber(stats_penalty[0], stats_penalty[1] - 1));
            endurance -= i32(randomNumber(stats_penalty[0], stats_penalty[1] - 1));
            dexterity -= i32(randomNumber(stats_penalty[0], stats_penalty[1] - 1));
            intelligence -= i32(randomNumber(stats_penalty[0], stats_penalty[1] - 1));
            luck -= i32(randomNumber(stats_penalty[0], stats_penalty[1] - 1));
        }
    }

    const item_token = {
        item_type: item_type,
        rarity_type: rarity_type,
        strength: u16(Math.max(0, strength)),
        endurance: u16(Math.max(0, endurance)),
        dexterity: u16(Math.max(0, dexterity)),
        intelligence: u16(Math.max(0, intelligence)),
        luck: u16(Math.max(0, luck)),
    } as ChItemToken;

    return item_token;
}

const ChRarityBaseStats: u32[][] = [
    [75, 175],
    [150, 350],
    [300, 500],
    [500, 800],
];

// TODO: update these arrays when new items gets implemented!
export const ChCommonItemIds: ChItemType[] = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69];
export const ChRareItemIds: ChItemType[] = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70];
export const ChEpicItemIds: ChItemType[] = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71];
export const ChLegendaryItemIds: ChItemType[] = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72];

/*
 * testnet only
 */

export function ch_generate_item_impl(account_id: AccountId, item_type: ChItemType, rarity_type: ChRarityType): void {
    _onlyTestNet();
    _onlyPxDapps();
    const item_token = ch_generate_item_token(item_type, rarity_type);
    ch_create_item(account_id, item_token);
}