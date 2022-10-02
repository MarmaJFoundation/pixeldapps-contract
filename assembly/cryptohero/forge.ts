import { context, logging, u128 } from "near-sdk-as";
import { _onlyPxDapps } from "../asserts";
import { ft_transfer_internal_impl } from "../nep/141";
import { AccountId, is_testnet_env, randomNumber, TokenId, toYoctoToken, BANK_ACCOUNT } from "../utils";
import { ChItemToken, ChRarityType } from "./helper/ch_types";
import { ch_delete_item_impl, ChCommonItemIds, ch_create_item, ChEpicItemIds, ch_generate_item_token, ChLegendaryItemIds, ChRareItemIds } from "./helper/itemtoken_storage";
import { chItemTokenRegistry } from "./helper/storage_manager";
import { CH_TAX_FORGE_COMMON_ITEMS, CH_TAX_FORGE_EPIC_ITEMS, CH_TAX_FORGE_LEGENDARY_ITEMS, CH_TAX_FORGE_RARE_ITEMS } from "./helper/utils";

export function ch_forge_items_impl(left_token_id: TokenId, right_token_id: TokenId): ChItemToken | null {
    assert(left_token_id != right_token_id, "Can't forge an item with itself");

    const left_item_token = chItemTokenRegistry.getSome(left_token_id);
    const account_id = context.predecessor;

    assert(left_item_token.owner == account_id, "You don't own this item");
    assert(left_item_token.price == u128.Zero, "You can't forge an item for sale");

    const right_item_token = chItemTokenRegistry.getSome(right_token_id);

    assert(right_item_token.owner == account_id, "You don't own this item");
    assert(right_item_token.price == u128.Zero, "You can't forge an item for sale");

    // assert(left_item_token.item_type == right_item_token.item_type, "Items type should be the same");// items of different types generate random item
    assert(left_item_token.rarity_type == right_item_token.rarity_type, "Items rarity should be the same");

    charge_to_forge_items(account_id, left_item_token.rarity_type);

    if (is_testnet_env()) {
        logging.log(`@${account_id} is forging items...`);
    }

    ch_delete_item_impl(left_token_id);
    ch_delete_item_impl(right_token_id);

    const result_token = get_forge_result(left_item_token, right_item_token);

    if (result_token != null) {
        ch_create_item(account_id, result_token);
        if (is_testnet_env()) {
            logging.log(`@${account_id}'s forge succeeded!`);
        }
        result_token.owner = account_id;// just for not showing '"owner": null' on explorer logs
    }
    else if (is_testnet_env()) {
        logging.log(`@${account_id}'s forge failed!`);
    }

    return result_token;
}

function charge_to_forge_items(account_id: AccountId, rarity_type: ChRarityType): void {
    let amount_converted: u128 = u128.Zero;

    switch (rarity_type) {
        case ChRarityType.Common:
            amount_converted = toYoctoToken(CH_TAX_FORGE_COMMON_ITEMS);
            break;

        case ChRarityType.Rare:
            amount_converted = toYoctoToken(CH_TAX_FORGE_RARE_ITEMS);
            break;

        case ChRarityType.Epic:
            amount_converted = toYoctoToken(CH_TAX_FORGE_EPIC_ITEMS);
            break;

        case ChRarityType.Legendary:
            amount_converted = toYoctoToken(CH_TAX_FORGE_LEGENDARY_ITEMS);
            break;
        default:
            throw "Unknown item rarity type";
    }
    if (amount_converted > u128.Zero) {
        logging.log("Fee: " + amount_converted.toString());
        ft_transfer_internal_impl(account_id, BANK_ACCOUNT, amount_converted.toString(), null);
    }
}

function get_forge_result(left_token: ChItemToken, right_token: ChItemToken): ChItemToken | null {
    let orig_item_idx: i32 = -1;
    let new_item_type: i32 = -1;
    let new_item_token: ChItemToken | null = null;
    let new_item_rarity: ChRarityType = ChRarityType.None;
    const is_same_type = left_token.item_type == right_token.item_type;
    const chance: u32 = randomNumber(0, 99);

    switch (left_token.rarity_type) {
        case ChRarityType.Common:
            if (is_same_type) {
                orig_item_idx = ChCommonItemIds.indexOf(left_token.item_type);
            }
            if (chance < 1) {
                new_item_rarity = ChRarityType.Rare;
            }
            else if (chance < 20) {
                // does nothing, player just lose both items
            }
            else {
                new_item_rarity = ChRarityType.Common;
            }
            break;

        case ChRarityType.Rare:
            if (is_same_type) {
                orig_item_idx = ChRareItemIds.indexOf(left_token.item_type);
            }
            if (chance < 1) {
                new_item_rarity = ChRarityType.Epic;
            }
            else if (chance < 10) {
                new_item_rarity = ChRarityType.Common;
            }
            else {
                new_item_rarity = ChRarityType.Rare;
            }
            break;

        case ChRarityType.Epic:
            if (is_same_type) {
                orig_item_idx = ChEpicItemIds.indexOf(left_token.item_type);
            }
            if (chance < 1) {
                new_item_rarity = ChRarityType.Legendary;
            }
            else if (chance < 5) {
                new_item_rarity = ChRarityType.Rare;
            }
            else {
                new_item_rarity = ChRarityType.Epic;
            }
            break;

        case ChRarityType.Legendary:
            if (is_same_type) {
                orig_item_idx = ChLegendaryItemIds.indexOf(left_token.item_type);
            }
            new_item_rarity = ChRarityType.Legendary;
            break;
    }

    switch (new_item_rarity) {
        case ChRarityType.Common:
            if (!is_same_type) {
                orig_item_idx = i32(randomNumber(0, ChCommonItemIds.length - 1));
            }
            new_item_type = ChCommonItemIds[orig_item_idx];
            break;

        case ChRarityType.Rare:
            if (!is_same_type) {
                orig_item_idx = i32(randomNumber(0, ChRareItemIds.length - 1));
            }
            new_item_type = ChRareItemIds[orig_item_idx];
            break;

        case ChRarityType.Epic:
            if (!is_same_type) {
                orig_item_idx = i32(randomNumber(0, ChEpicItemIds.length - 1));
            }
            new_item_type = ChEpicItemIds[orig_item_idx];
            break;

        case ChRarityType.Legendary:
            if (!is_same_type) {
                orig_item_idx = i32(randomNumber(0, ChLegendaryItemIds.length - 1));
            }
            new_item_type = ChLegendaryItemIds[orig_item_idx];
            break;
    }

    if (new_item_rarity != ChRarityType.None && new_item_type != -1) {
        new_item_token = ch_generate_item_token(u16(new_item_type), new_item_rarity);
    }

    return new_item_token;
}