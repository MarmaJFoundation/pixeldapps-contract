import { context } from "near-sdk-as";
import { petTokenRegistry, playerRegistry } from "./helper/storage_manager";
import { PlayerData, StateType } from "./helper/pp_types";
import { _onlyPxDapps } from "../asserts";
import { nanoToMinuteFactor } from "../utils";

@nearBindgen
export class FightPetInfo {
    token_id: string;
    injured: bool;
    xp_gain: u16;
    level_up: bool;
}

@nearBindgen
export class FightPlayerResult {
    account_id: string;
    pet_results: FightPetInfo[];
    rating_change: i32;
    won: bool
}

export function save_fight_result_impl(result: FightPlayerResult): void {
    _onlyPxDapps();
    const winner = playerRegistry.getSome(result.account_id);

    const processed_winner = process_result(winner, result);

    playerRegistry.set(result.account_id, processed_winner);
}

function process_result(player_data: PlayerData, result: FightPlayerResult): PlayerData {

    if (result.won) {
        player_data.matches_won++;
    } else {
        player_data.matches_lost++;
    }

    let new_rating: i32 = player_data.rating + result.rating_change;

    if (new_rating < 0) {
        new_rating = 0;
    } else if (new_rating > 65535) {
        new_rating = 65535;
    }

    player_data.rating = u16(new_rating);

    for (let i: u32 = 0; i < u32(result.pet_results.length); i++) {
        const pet_data_new = result.pet_results[i];
        const pettoken = petTokenRegistry.getSome(pet_data_new.token_id);

        if (pet_data_new.injured) {
            pettoken.state = StateType.Injured;
            pettoken.state_timer = context.blockTimestamp + (nanoToMinuteFactor * 3) * pettoken.level;
        }
        pettoken.xp = pettoken.xp + pet_data_new.xp_gain;
        if (pet_data_new.level_up) {
            pettoken.level = pettoken.level + 1;
        }
        petTokenRegistry.set(pettoken.token_id, pettoken);
    }
    player_data.fight_balance--;

    return player_data;
}