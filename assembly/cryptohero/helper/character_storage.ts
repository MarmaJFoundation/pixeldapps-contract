import { context, logging } from "near-sdk-as";
import { ft_transfer_internal_impl } from "../../nep/141";
import { AccountId, BANK_ACCOUNT, CharacterId, is_testnet_env, toYoctoToken } from "../../utils";
import { ch_create_potion } from "../game";
import { ChCharacterData, ChClassType, ChPotionData, ChPotionType } from "./ch_types";
import { ch_get_character_registry_by_id, chPlayerRegistry } from "./storage_manager";
import { ChAllClassTypes, ChAllPotionTypes, CH_TAX_CHARACTER_BUY_POTION } from "./utils";

export function ch_get_character_prefix(account_id: AccountId, class_type: ChClassType): CharacterId {
    if (is_testnet_env()) {// keep testnet working pls
        return `f:${class_type}:${account_id}`;
    }
    return `${account_id}:${class_type}`;
}

export function ch_unlock_character_impl(class_type: ChClassType): void {
    const account_id = context.predecessor;
    assert(ChAllClassTypes.includes(class_type), "Unknown class type");

    const player_data = chPlayerRegistry.getSome(account_id);
    const character_id = ch_get_character_prefix(account_id, class_type);

    assert(!player_data.character_ids.includes(character_id), "Character already unlocked");

    //const amount_converted = toYoctoToken(CH_TAX_CHARACTER_UNLOCK);
    //ft_transfer_internal_impl(account_id, BANK_ACCOUNT, amount_converted.toString(), null);

    const character_data = { character_id: character_id, class_type: class_type } as ChCharacterData;
    const character_registry = ch_get_character_registry_by_id(character_id);

    character_registry.set(character_id, character_data);

    player_data.character_ids.push(character_id);
    chPlayerRegistry.set(account_id, player_data);

    if (is_testnet_env()) {
        logging.log(`@${account_id} unlocked character #${class_type}`);
    }
}

export function ch_get_characters_by_ids_impl(character_ids: CharacterId[]): ChCharacterData[] {
    const characters_data: ChCharacterData[] = new Array<ChCharacterData>(character_ids.length);
    for (let i: i32 = 0; i < character_ids.length; i++) {
        const character_registry = ch_get_character_registry_by_id(character_ids[i]);
        characters_data[i] = character_registry.getSome(character_ids[i]);
    }
    return characters_data;
}

export function ch_character_buy_potion_impl(class_type: ChClassType, potion_type: ChPotionType): ChPotionData | null {
    assert(ChAllClassTypes.includes(class_type), "Unknown class type");
    assert(ChAllPotionTypes.includes(potion_type), "Unknown potion type");

    const account_id = context.predecessor;
    const player_data = chPlayerRegistry.getSome(account_id);
    const character_id = ch_get_character_prefix(account_id, class_type);

    assert(player_data.character_ids.includes(character_id), "Character not unlocked");

    const character_registry = ch_get_character_registry_by_id(character_id);
    const character_data = character_registry.getSome(character_id);
    const potion_index = ch_get_potion_index(character_data.potions, potion_type);

    assert(potion_index == -1, "Still have potions of this type");

    const amount_converted = toYoctoToken(CH_TAX_CHARACTER_BUY_POTION);
    logging.log("Fee: " + amount_converted.toString());
    ft_transfer_internal_impl(account_id, BANK_ACCOUNT, amount_converted.toString(), null);

    const new_potion_data = ch_create_potion(potion_type);

    character_data.potions.push(new_potion_data);
    character_registry.set(character_id, character_data);

    if (is_testnet_env()) {
        logging.log(`@${account_id} bought potion <${potion_type},${new_potion_data.amount},${new_potion_data.strength}> to character #${class_type}`);
    }

    return new_potion_data;
}

export function ch_get_potion_index(potions_data: ChPotionData[], potion_type: ChPotionType): i32 {
    if (potions_data.length != 0) {
        for (let i: i32 = 0; i < potions_data.length; i++) {
            if (potions_data[i].potion_type == potion_type) {
                return i;
            }
        }
    }
    return -1;
}

export function ch_use_potion(account_id: AccountId, character_data: ChCharacterData, potion_type: ChPotionType): ChPotionData[] {
    const potions_data = character_data.potions;
    const index = ch_get_potion_index(potions_data, potion_type);
    if (index != -1) {
        if (potions_data[index].amount > 0) {
            potions_data[index].amount = u8(potions_data[index].amount - 1);
        }
        if (potions_data[index].amount > 0) {
            if (is_testnet_env()) {
                logging.log(`@${account_id} used 1x potion #${potion_type}`);
            }
        }
        else {
            potions_data.splice(index, 1);
            if (is_testnet_env()) {
                logging.log(`@${account_id} used his last potion #${potion_type}`);
            }
        }
    }
    return potions_data;
}