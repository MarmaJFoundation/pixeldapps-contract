import { logging } from "near-sdk-core";
import { _onlyPxDapps, _onlyTestNet } from "../../asserts";
import { AccountId, is_testnet_env, RaidId } from "../../utils";
import { ChDifficultyType, ChRaidData } from "./ch_types";
import { ch_get_raid_registry_by_id, chPlayerRegistry } from "./storage_manager";
import { CH_RAID_PLAYERS_COUNT } from "./utils";

export function ch_get_raid_prefix(account_id: AccountId, week_code: string): RaidId {
    return `r:${week_code}:${account_id}`;
}

export function ch_create_raid_impl(account_id: AccountId, week_code: string, difficulty: ChDifficultyType): RaidId {
    _onlyPxDapps();

    const raid_id = ch_get_raid_prefix(account_id, week_code);
    const raid_registry = ch_get_raid_registry_by_id(raid_id);

    assert(!raid_registry.contains(raid_id), "Raid already exists");

    const raid_data = {
        raid_id: raid_id,
        difficulty: difficulty,
        account_ids: [],
        boss_kills: 0,
    } as ChRaidData;

    raid_registry.set(raid_id, raid_data);

    if (is_testnet_env()) {
        logging.log(`@${account_id} created a raid within difficulty level of ${difficulty + 1} at week ${week_code}`);
    }

    ch_join_raid_impl(account_id, account_id, week_code);
    return raid_id;
}

export function ch_join_raid_impl(account_id: AccountId, leader_id: AccountId, week_code: string): void {
    _onlyPxDapps();

    const raid_id = ch_get_raid_prefix(leader_id, week_code);
    const raid_registry = ch_get_raid_registry_by_id(raid_id);

    assert(raid_registry.contains(raid_id), "Raid does not exists");

    const raid_data = raid_registry.getSome(raid_id);

    assert(!raid_data.account_ids.includes(account_id), "Player already in room");
    assert(raid_data.account_ids.length < CH_RAID_PLAYERS_COUNT, "Raid is full");

    raid_data.account_ids.push(account_id);
    raid_registry.set(raid_id, raid_data);

    const player_data = chPlayerRegistry.getSome(account_id);
    player_data.joined_raids.push(week_code);
    chPlayerRegistry.set(account_id, player_data);

    if (is_testnet_env() && account_id != leader_id) {
        logging.log(`@${account_id} joined @${leader_id}'s raid`);
    }
}

export function ch_delete_raid_impl(account_id: AccountId, week_code: string): void {
    _onlyPxDapps();
    _onlyTestNet();

    const raid_id = ch_get_raid_prefix(account_id, week_code);
    const raid_registry = ch_get_raid_registry_by_id(raid_id);

    assert(raid_registry.contains(raid_id), "Raid does not exists");

    const raid_data = raid_registry.getSome(raid_id);

    for (let i: i32 = 0; i < raid_data.account_ids.length; i++) {
        const current_account_id = raid_data.account_ids[i];
        const player_data = chPlayerRegistry.getSome(current_account_id);
        const index = player_data.joined_raids.indexOf(week_code);
        player_data.joined_raids.splice(index, 1);
        chPlayerRegistry.set(current_account_id, player_data);
    }

    raid_registry.delete(raid_id);

    if (is_testnet_env()) {
        logging.log(`@${account_id}'s raid has been deleted`);
    }
}

export function ch_get_raids_by_ids_impl(raid_ids: RaidId[]): ChRaidData[] {
    const raids_data: ChRaidData[] = new Array<ChRaidData>(raid_ids.length);
    for (let i: i32 = 0; i < raid_ids.length; i++) {
        const raid_registry = ch_get_raid_registry_by_id(raid_ids[i]);
        raids_data[i] = raid_registry.getSome(raid_ids[i]);
    }
    return raids_data;
}