import { u128 } from "near-sdk-as";
import { context, logging } from "near-sdk-core";
import { _onlyPxDapps, _onlyTestNet } from "../asserts";
import { AccountId, MANAGER_ACCOUNT, is_testnet_dev, is_testnet_env, ONE_DAY_IN_NS, ONE_HOUR_IN_NS, ONE_MICRO_SECOND, ONE_MINUTE_IN_NS, ONE_NANO_SECOND, sendNear, TokenId, randomNumber } from "../utils";
import { ch_custom_balance_of_impl, ch_give_random_item_impl } from "./helper/ch_lootbox_titan";
import { ChAccountData, ChDifficultyType, ChItemToken, ChPlayerData, ChPotionData, ChPotionType, ChRarityType, ChSupply, ChTitanReward } from "./helper/ch_types";
import { ch_ensure_items_threshold } from "./helper/itemtoken_storage";
import { ch_get_character_registry_by_id, chItemTokenRegistry, chPlayerRegistry, chLootboxRegistry } from "./helper/storage_manager";

export function ch_is_player_registered_impl(account_id: AccountId): bool {
    return chPlayerRegistry.contains(account_id);
}

export function ch_register_player_impl(): void {
    const account_id = context.predecessor;

    assert(account_id.length < 63 && (account_id.endsWith(".near") || account_id.endsWith(".testnet")), "Please use a .near account to play Cryptohero.");
    assert(!chPlayerRegistry.contains(account_id), "Wallet already registered");

    chPlayerRegistry.set(account_id, new ChPlayerData());
}

export function ch_unregister_player_impl(account_id: AccountId): void {
    _onlyTestNet();
    assert(chPlayerRegistry.contains(account_id), "Wallet not found");
    const player_data = chPlayerRegistry.getSome(account_id);

    // delete all items
    for (let i: i32 = 0; i < player_data.item_ids.length; i++) {
        chItemTokenRegistry.delete(player_data.item_ids[i]);
    }

    // delete all chars
    for (let i: i32 = 0; i < player_data.character_ids.length; i++) {
        const character_registry = ch_get_character_registry_by_id(player_data.character_ids[i]);
        character_registry.delete(player_data.character_ids[i]);
    }

    // delete account
    chPlayerRegistry.delete(account_id);

    if (is_testnet_env()) {
        logging.log(`@${account_id} account has been deleted`);
    }
}

export function ch_get_player_data_impl(account_id: AccountId): ChAccountData {
    const account_data = new ChAccountData();
    account_data.playerdata = chPlayerRegistry.getSome(account_id);
    account_data.balance = ch_custom_balance_of_impl(account_id);
    account_data.balance.titan_timer /= ONE_MICRO_SECOND;
    return account_data;
}

export function ch_refill_fight_balance_impl(): void {
    const account_id = context.predecessor;

    assert(context.attachedDeposit == u128.from("200000000000000000000000"), "You need to attach 0.20N");

    const player_data = chPlayerRegistry.getSome(account_id);

    assert(player_data.fight_balance <= 1, "You still have fight points left before you need to refill");

    player_data.fight_balance = player_data.fight_balance + 100;
    chPlayerRegistry.set(account_id, player_data);

    sendNear(MANAGER_ACCOUNT, u128.from("180000000000000000000000"));

    if (is_testnet_env()) {
        logging.log(`@${account_id} refilled its fight points`);
    }
}

export function ch_claim_titan_reward_impl(): ChTitanReward {
    const account_id = context.predecessor;
    const balance = chLootboxRegistry.get(account_id, new ChSupply())!;

    assert(balance.titan > 0, "You don't own a titan");
    assert(balance.titan_timer < context.blockTimestamp, "Titan not ready");

    ch_ensure_items_threshold(account_id, balance.titan);

    if (is_testnet_env()) {
        logging.log(`@${account_id} is claiming titan...`);
    }

    const item_tokens: ChItemToken[] = new Array<ChItemToken>(balance.titan);

    for (let i: u32 = 0; i < balance.titan; i++) {
        const token_id: TokenId = ch_give_random_item_impl(account_id, ChRarityType.Epic);
        item_tokens[i] = chItemTokenRegistry.getSome(token_id);
    }

    let titan_cooldown: u64 = context.blockTimestamp + (ONE_DAY_IN_NS * 7);
    if (is_testnet_env()) {
        titan_cooldown = context.blockTimestamp + (ONE_NANO_SECOND * 15);
    }

    balance.titan_timer = titan_cooldown;
    chLootboxRegistry.set(account_id, balance);

    return {
        item_tokens: item_tokens,
        timestamp: titan_cooldown / ONE_MICRO_SECOND,
    } as ChTitanReward;
}

export function ch_decrement_fightpoints(account_id: AccountId): void {
    const player_data = chPlayerRegistry.getSome(account_id);
    if (player_data.fight_balance > 0) { //use assert here? | this is just a double check, backend already asserts low fight balance
        player_data.fight_balance = player_data.fight_balance - 1;
        chPlayerRegistry.set(account_id, player_data);

        if (is_testnet_env()) {
            if (player_data.fight_balance == 0) {
                logging.log(`@${account_id} used its last fight point`);
            }
        }
    }
}

export function ch_set_fightpoints_impl(account_id: AccountId, value: u16): void {
    _onlyPxDapps();
    _onlyTestNet();
    const player_data = chPlayerRegistry.getSome(account_id);
    const old_value = player_data.fight_balance;
    player_data.fight_balance = value;
    chPlayerRegistry.set(account_id, player_data);
    if (is_testnet_env()) {
        if (old_value != value) {
            logging.log(`@${account_id} fight points changed from ${old_value} to ${value}`);
        }
    }
}

export function ch_create_potion(potion_type: ChPotionType): ChPotionData {
    const amount: u8 = 3;
    let strength: u8 = 0;

    switch (potion_type) {
        case ChPotionType.Strength:
            strength = u8(randomNumber(7, 15));
            break;

        case ChPotionType.Stamina:
            strength = u8(randomNumber(15, 30));
            break;

        case ChPotionType.Luck:
            strength = u8(randomNumber(7, 15));
            break;
    }

    return new ChPotionData(
        potion_type,
        amount,
        strength
    );
}

export function ch_get_exp_for_level(level: u8): u32 {
    return u32(Math.round(50 * level * (1 + level * .2)));
}