import { context, logging } from "near-sdk-as";
import { _onlyPxDapps } from "../asserts";
import { is_testnet_env } from "../utils";
import { ch_decrement_fightpoints, ch_get_exp_for_level } from "./game";
import { ch_get_character_prefix, ch_use_potion } from "./helper/character_storage";
import { ChPotionType, ChRaidInfo } from "./helper/ch_types";
import { ch_get_raid_prefix } from "./helper/raid_storage";
import { ch_get_character_registry_by_id, ch_get_raid_registry_by_id } from "./helper/storage_manager";
import { CH_RAID_PLAYERS_COUNT } from "./helper/utils";

export function ch_save_raid_result_impl(result: ChRaidInfo): void {
    _onlyPxDapps();

    const raid_id = ch_get_raid_prefix(result.leader_id, result.week_code);
    const raid_registry = ch_get_raid_registry_by_id(raid_id);

    assert(raid_registry.contains(raid_id), "Raid does not exists");

    const raid_data = raid_registry.getSome(raid_id);

    if (!is_testnet_env()) {
        assert(raid_data.account_ids.length == CH_RAID_PLAYERS_COUNT, "Raid is not full");
    }
    assert(raid_data.account_ids.includes(result.account_id), "Player not found");

    if (result.victory) {
        raid_data.boss_kills = raid_data.boss_kills + 1;
        raid_registry.set(raid_id, raid_data);

        if (is_testnet_env()) {
            if (result.account_id != result.leader_id) {
                logging.log(`@${result.account_id} granted one more victory to @${result.leader_id}'s raid of level ${raid_data.difficulty + 1}`);
            }
            else {
                logging.log(`@${result.account_id} granted one more victory to its own raid of level ${raid_data.difficulty + 1}`);
            }
        }
    }
    else {
        if (is_testnet_env()) {
            if (result.account_id != result.leader_id) {
                logging.log(`@${result.account_id} got injured in @${result.leader_id}'s raid of level ${raid_data.difficulty + 1}`);
            }
            else {
                logging.log(`@${result.account_id} got injured in its own raid of level ${raid_data.difficulty + 1}`);
            }
        }
    }

    ch_update_character_results(result);
    ch_decrement_fightpoints(result.account_id);
}

// while we're storing raid groups in mongodb
// we'd still need to set character injured and decrement fight points
export function ch_save_raid_result_tmp_impl(result: ChRaidInfo): void {
    _onlyPxDapps();

    if (result.victory) {
        if (is_testnet_env()) {
            if (result.account_id != result.leader_id) {
                logging.log(`@${result.account_id} granted one more victory to @${result.leader_id}'s raid of level ${result.difficulty + 1}`);
            }
            else {
                logging.log(`@${result.account_id} granted one more victory to its own raid of level ${result.difficulty + 1}`);
            }
        }
    }
    else {
        if (is_testnet_env()) {
            if (result.account_id != result.leader_id) {
                logging.log(`@${result.account_id} got injured in @${result.leader_id}'s raid of level ${result.difficulty + 1}`);
            }
            else {
                logging.log(`@${result.account_id} got injured in its own raid of level ${result.difficulty + 1}`);
            }
        }
    }

    ch_update_character_results(result);
    ch_decrement_fightpoints(result.account_id);
}

function ch_update_character_results(result: ChRaidInfo): void {
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

    character_data.injured_timer = context.blockTimestamp + result.character_results.resting_timer;
    character_registry.set(character_id, character_data);
}