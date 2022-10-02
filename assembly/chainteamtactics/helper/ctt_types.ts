import { u128 } from "near-sdk-as";
import { AccountId, TokenId } from "../../utils";
import { TokenMetadata } from "./ctt_nep";

@nearBindgen
export class PxBalanceCTT {
    constructor(
        public pixeltoken: string,
        public tokens: string
    ) { }
}

@nearBindgen
export class CttAccountData {
    public playerdata: CttPlayerData;
    public balance: PxBalanceCTT;
}

@nearBindgen
export class CttPlayerData {
    public unit_ids: TokenId[] = [];
    //public matches_won: u16 = 0;
    //public matches_lost: u16 = 0;
    //public rating: u16 = 800;
}

@nearBindgen
export class CttUnitToken {
    public token_id: TokenId;
    public unit_type: CttUnitType;
    public health_mod: u16;
    public damage_mod: u16;
    public speed_mod: u16;
    public owner: string;
    public owner_id: string;
    public price: u128 = u128.Zero;
    public metadata: TokenMetadata;
}

@nearBindgen
export class CttUnitBaseData {
    public unit_type: CttUnitType;
    public health: u16;
    public damage: u16;
    public speed: u8;
}

@nearBindgen
export class CttFightResult {
    public winner_id: AccountId;
    public winner_rating_change: i32;
    public loser_id: AccountId;
    public loser_rating_change: i32;
    public bet_type: CttBetTierTypes;
}

export enum CttUnitType {
    None = 0,
    Squire = 1,
    Knight = 2,
    Mage = 3,
    Chemist = 4,
    Executioner = 5,
    Marksman = 6,
    Priest = 7,
    Warlock = 8,
    Druid = 9,
    Bard = 10,
    Assassin = 11,
    Elementalist = 12,
    Necromancer = 13,
    Paladin = 14,
    TimeBender = 15,
    Skeleton = 16,
    Wolf = 17,
}


export enum CttBetTierTypes {
    Tier1 = 0,// 10 PXT
    Tier2 = 1,// 50 PXT
    Tier3 = 2,// 200 PXT
    Tier4 = 3,// 500 PXT
}