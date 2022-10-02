import { context, logging } from "near-sdk-core";
import { _onlyPxDapps } from "../asserts";
import { is_testnet_env, TokenId } from "../utils";
import { ch_decrement_fightpoints, ch_get_exp_for_level } from "./game";
import { ch_get_character_prefix, ch_use_potion } from "./helper/character_storage";
import { ChPotionType, DungeonInfo } from "./helper/ch_types";
import { ch_create_item } from "./helper/itemtoken_storage";
import { ch_get_character_registry_by_id } from "./helper/storage_manager";

export function ch_save_dungeon_result_impl(result: DungeonInfo): TokenId {
    _onlyPxDapps();
    update_character_results(result);
    return update_player_results(result);
}

function update_character_results(result: DungeonInfo): void {
    const character_id = ch_get_character_prefix(result.account_id, result.character_results.class_type);
    const character_registry = ch_get_character_registry_by_id(character_id);
    const character_data = character_registry.getSome(character_id);

    character_data.experience = character_data.experience + result.character_results.exp_gain;
    if (result.character_results.level_up) {
        do {
            character_data.level = character_data.level + 1;
        } while (character_data.experience >= ch_get_exp_for_level(character_data.level));
    }

    character_data.potions = ch_use_potion(result.account_id, character_data, ChPotionType.Strength);
    character_data.potions = ch_use_potion(result.account_id, character_data, ChPotionType.Stamina);
    character_data.potions = ch_use_potion(result.account_id, character_data, ChPotionType.Luck);

    character_data.injured_timer = context.blockTimestamp + result.character_results.resting_timer;
    character_registry.set(character_id, character_data);

    if (is_testnet_env()) {
        logging.log(`@${result.account_id} ${result.dungeon_results.victory ? "just finished" : "has been defeated in"} a dungeon of level ${result.dungeon_results.difficulty + 1} with its character #${character_data.class_type} (Lvl: ${character_data.level}, Exp: ${character_data.experience})`);
    }
}

function update_player_results(result: DungeonInfo): TokenId {
    let token_id: TokenId = "";

    if (result.dungeon_results.victory) {
        token_id = ch_create_item(result.account_id, result.dungeon_results.item_drop);
    }

    ch_decrement_fightpoints(result.account_id);
    return token_id;
}