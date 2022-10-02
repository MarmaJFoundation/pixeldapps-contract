import { _onlyPxDapps } from "../../asserts";
import { ft_balance_of_impl } from "../../nep/141";
import { AccountId, randomNumber, TokenId } from "../../utils";
import { ChItemToken, ChItemType, ChRarityType, ChSupply, PxBalanceCH } from "./ch_types";
import { ChCommonItemIds, ChEpicItemIds, ChLegendaryItemIds, ChRareItemIds, ch_create_item, ch_ensure_items_threshold, ch_generate_item_token } from "./itemtoken_storage";
import { chLootboxRegistry } from "./storage_manager";

export function ch_custom_balance_of_impl(account_id: string): PxBalanceCH {
    const balance = chLootboxRegistry.get(account_id, new ChSupply())!;
    const returnBalance = new PxBalanceCH(ft_balance_of_impl(account_id), balance.common, balance.rare, balance.epic, balance.legendary, balance.titan, balance.titan_timer);
    return returnBalance;
}

export function ch_give_random_item_impl(account_id: string, rarity_type: ChRarityType): TokenId {
    let item_type: ChItemType = 1;

    if (rarity_type == ChRarityType.Legendary) {
        item_type = ChLegendaryItemIds[randomNumber(0, ChLegendaryItemIds.length - 1)];
    } else if (rarity_type == ChRarityType.Epic) {
        item_type = ChEpicItemIds[randomNumber(0, ChEpicItemIds.length - 1)];
    } else if (rarity_type == ChRarityType.Rare) {
        item_type = ChRareItemIds[randomNumber(0, ChRareItemIds.length - 1)];
    } else {
        item_type = ChCommonItemIds[randomNumber(0, ChCommonItemIds.length - 1)];
    }

    // ch_generate_item_impl(account_id, item_type, rarity);// this is a testnet-only function
    const item_token: ChItemToken = ch_generate_item_token(item_type, rarity_type);
    const token_id: TokenId = ch_create_item(account_id, item_token);

    return token_id;
}

export function ch_open_lootbox_impl(account_id: AccountId, item1: ChItemToken, item2: ChItemToken): void {
    _onlyPxDapps();

    assert(item1.rarity_type == item2.rarity_type, "Items rarity should be the same");// just incase something goes wrong
    ch_ensure_items_threshold(account_id, 2);

    const rarity_type: ChRarityType = item1.rarity_type;
    const balance = chLootboxRegistry.get(account_id, new ChSupply())!;

    switch (rarity_type) {
        case ChRarityType.Common:
            balance.common = balance.common - 1;
            break;
        case ChRarityType.Rare:
            balance.rare = balance.rare - 1;
            break;
        case ChRarityType.Epic:
            balance.epic = balance.epic - 1;
            break;
        case ChRarityType.Legendary:
            balance.legendary = balance.legendary - 1;
            break;
    }

    ch_create_item(account_id, item1);
    ch_create_item(account_id, item2);

    chLootboxRegistry.set(account_id, balance);
}

export function ch_add_lootbox_impl(account_id: string, rarity_type: ChRarityType): void {
    _onlyPxDapps();
    const balance = chLootboxRegistry.get(account_id, new ChSupply())!;

    switch (rarity_type) {
        case ChRarityType.Common:
            balance.common = balance.common + 1;
            break;
        case ChRarityType.Rare:
            balance.rare = balance.rare + 1;
            break;
        case ChRarityType.Epic:
            balance.epic = balance.epic + 1;
            break;
        case ChRarityType.Legendary:
            balance.legendary = balance.legendary + 1;
            break;
        case ChRarityType.Titan:
            balance.titan = balance.titan + 1;
            break;
        default:
            break;
    }

    chLootboxRegistry.set(account_id, balance);
}
