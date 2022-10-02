import { u128 } from "near-sdk-as";
import { TokenId } from "../../utils";
import { generate_powerlevel } from "../pets";
import { PxBalanceWithToken } from "./utils";

@nearBindgen
export class hatchState {
    rarity: RarityType;
    timestamp: u64;
}

@nearBindgen
export class trainingState {
    token_id: TokenId;
    timestamp: u64;
}

@nearBindgen
export class PlayerData {
    pet_ids: String[] = []; //just the token numbers
    hatching: hatchState = { rarity: 4, timestamp: 0 }; //change to 4 for none
    train_timer: u64 = 0;
    matches_won: u16 = 0;
    matches_lost: u16 = 0;
    rating: u16 = 800;
    fight_balance: u16 = 25;
}


@nearBindgen
export class PetBaseData {
    public pet_id: u8;
    public pet_name: string
    public damage_type: ElementType;
    public body_type: ElementType;
    public damage: u16;
    public speed: u16;
    public defense: u16;
    public magic: u16;
    public evolution: u8;
    public evolution_to: u8;
    public evolution_name: string
}

@nearBindgen
export class PetToken {
    public token_id: TokenId;
    public pet_type: u8;
    public train_level: u8 = 1;
    public xp: u32 = 0;
    public level: u8 = 1;
    public power_level: u8 = generate_powerlevel(0);
    public owner: string;
    public price: u128 = u128.Zero;
    public rarity: RarityType = 0;
    public state: StateType = StateType.Training;
    public state_timer: u64 = 0;
}

@nearBindgen
export class AccountData {
    balance: PxBalanceWithToken;
    playerdata: PlayerData;
    owns_sungen: bool;
    sungen_timer: u64;
}

export enum ElementType {
    Pet = 0,
    Onyx = 1,
    Fire = 2,
    Water = 3,
    Electric = 4,
    Ghost = 5,
    Plant = 6,
    Psychic = 7,
    Sand = 8
}

export enum RarityType {
    Normal = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3,
    None = 4
}

export enum StateType {
    Training = 0,
    Injured = 1,
    ForSale = 2
}
export const CREATURETYPE_COUNT = 15;
