import { u128 } from "near-sdk-core";
import { AccountId, CharacterId, RaidId, TokenId } from "../../utils";

@nearBindgen
export class ChSupply {
    public common: u32 = 0;
    public rare: u32 = 0;
    public epic: u32 = 0;
    public legendary: u32 = 0;
    public titan: u32 = 0;
    public titan_timer: u64 = 0;
}

@nearBindgen
export class PxBalanceCH {
    constructor(
        public pixeltoken: string,
        public common: u32,
        public rare: u32,
        public epic: u32,
        public legendary: u32,
        public titan: u32,
        public titan_timer: u64) { }
}

@nearBindgen
export class ChAccountData {
    public playerdata: ChPlayerData;
    public balance: PxBalanceCH;
}

@nearBindgen
export class ChPlayerData {
    public item_ids: TokenId[] = [];
    public character_ids: CharacterId[] = [];
    public joined_raids: RaidId[] = [];
    public fight_balance: u16 = 25;
}

@nearBindgen
export class ChCharacterData {
    public character_id: CharacterId;
    public class_type: ChClassType = 0;
    public experience: u32 = 0;
    public level: u8 = 1;
    public injured_timer: u64 = 0;
    public potions: ChPotionData[] = [];
}

@nearBindgen
export class ChPotionData {
    constructor(
        public potion_type: ChPotionType,
        public amount: u8,
        public strength: u8,
    ) { }
}

@nearBindgen
export class ChItemToken {
    public token_id: TokenId;
    public item_type: ChItemType;
    public rarity_type: ChRarityType = 0;
    public strength: u16;
    public dexterity: u16;
    public endurance: u16;
    public intelligence: u16;
    public luck: u16;
    public owner: string;
    public price: u128 = u128.Zero;
    public cd: u64 = 0;
}

@nearBindgen
export class DungeonCharacterInfo {
    class_type: ChClassType;
    exp_gain: u16;
    level_up: bool;
    resting_timer: u64;
}

@nearBindgen
export class DungeonResultInfo {
    difficulty: ChDifficultyType;
    victory: bool;
    item_drop: ChItemToken;
}

@nearBindgen
export class DungeonInfo {
    account_id: AccountId;
    character_results: DungeonCharacterInfo;
    dungeon_results: DungeonResultInfo;
}

@nearBindgen
export class ChRaidInfo {
    public account_id: AccountId;
    public character_results: DungeonCharacterInfo;
    public difficulty: ChDifficultyType;
    public victory: boolean;
    public leader_id: AccountId;
    public week_code: string;
}

@nearBindgen
export class ChRaidData {
    public raid_id: RaidId;
    public account_ids: AccountId[];
    public difficulty: ChDifficultyType;
    public boss_kills: u32;
}

@nearBindgen
export class ChTitanReward {
    public item_tokens: ChItemToken[];
    public timestamp: u64;
}

export type ChItemType = u16;

export enum ChRarityType {
    Common = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3,
    Titan = 4,
    None = 5,
}

export enum ChClassType {
    None = 0,
    Mage = 1,
    Knight = 2,
    Ranger = 3,
}

export enum ChEquipType {
    Armor = 0,
    Helmet = 1,
    Weapon = 2,
    Boots = 3,
    Necklace = 4,
    Ring = 5,
    Empty = 6,
}

export enum ChDifficultyType {
    Easy = 0,
    Medium = 1,
    Hard = 2,
    Hell = 3,
}

export enum ChPotionType {
    Strength = 0,
    Stamina = 1,
    Luck = 2,
}