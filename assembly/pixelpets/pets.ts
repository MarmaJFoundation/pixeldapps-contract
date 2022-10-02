import { _onlyContractOwner, _onlyPxDapps } from "../asserts";
import { randomNumber } from "../utils";
import { PetBaseData, RarityType } from "./helper/pp_types";
import { petBaseRegistry } from "./helper/storage_manager";

export function insert_update_pet_impl(petdata: PetBaseData): void {
    _onlyPxDapps();
    petBaseRegistry.set(petdata.pet_id, petdata);
}

export function generate_powerlevel(rarity: RarityType): u8 {
    if (rarity == RarityType.Normal) {
        return u8(randomNumber(40, 100));
    }
    if (rarity == RarityType.Rare) {
        return u8(randomNumber(52, 100));
    }
    if (rarity == RarityType.Epic) {
        return u8(randomNumber(64, 100));
    }
    return u8(randomNumber(76, 100)); //legendary
}

// -------------------------------------------------------------------------

/*
 * values based in current exp formula 'calculate_new_level'
 */
const pre_calc_exp_table: u32[] = [60, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500, 1760, 2040, 2340, 2660, 3000, 3360, 3740, 4140, 4560, 5000, 5460, 5940, 6440, 6960, 7500, 8060, 8640, 9240, 9860, 10500, 11160, 11840, 12540, 13260, 14000, 14760, 15540, 16340, 17160, 18000, 18860, 19740, 20640, 21560, 22500, 23460, 24440, 25440, 26460, 27500, 28560, 29640, 30740, 31860, 33000, 34160, 35340, 36540, 37760, 39000, 40260, 41540, 42840, 44160, 45500, 46860, 48240, 49640, 51060, 52500, 53960, 55440, 56940, 58460, 60000, 61560, 63140, 64740, 66360, 68000, 69660, 71340, 73040, 74760, 76500, 78260, 80040, 81840, 83660, 85500, 87360, 89240, 91140, 93060, 95000, 96960, 98940, 100940, 102960, 105000];

function math_clamp(number: i32, min: i32, max: i32): i32 {
    return i32(Math.max(min, Math.min(number, max)))
}

export function get_xp_for_level(level: i32): u32 {
    const xp_index: i32 = math_clamp(level - (1/*actual level index*/ + 1/*prev level index¹*/), 0, pre_calc_exp_table.length - 1);

    // ¹- each level's exp are actually the required exp for leveling up
    // so reducing pet's level by x, means it base exp are at prev index

    return pre_calc_exp_table[xp_index];
}

@nearBindgen
export class NewPetLevel {
    public ret_lvl: u8;
    public ret_xp: u32;
}

export function decrease_pet_level(level: i32): NewPetLevel {
    const new_lv: i32 = math_clamp(level - 4, 1, level);
    const new_xp: u32 = get_xp_for_level(new_lv);

    return { ret_lvl: u8(new_lv), ret_xp: new_xp } as NewPetLevel;
}