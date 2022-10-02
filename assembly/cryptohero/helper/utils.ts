import { ChClassType, ChPotionType } from "./ch_types";

export const ChAllClassTypes = [
    ChClassType.Mage,
    ChClassType.Knight,
    ChClassType.Ranger,
    // TODO: add new classes here when ChClassType gets updated!
];

export const ChAllPotionTypes = [
    ChPotionType.Strength,
    ChPotionType.Stamina,
    ChPotionType.Luck,
    // TODO: add new potions here when ChPotionType gets updated!
];

//export const CH_TAX_CHARACTER_UNLOCK: string = "100";
export const CH_TAX_CHARACTER_BUY_POTION: string = "40";

export const CH_TAX_FORGE_COMMON_ITEMS: string = "0";
export const CH_TAX_FORGE_RARE_ITEMS: string = "5";
export const CH_TAX_FORGE_EPIC_ITEMS: string = "10";
export const CH_TAX_FORGE_LEGENDARY_ITEMS: string = "50";

export const CH_RAID_PLAYERS_COUNT: i32 = 8;
export const CH_MAX_ITEMS_COUNT: i32 = 60;