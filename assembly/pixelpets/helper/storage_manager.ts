import { PersistentDeque, PersistentMap, u128 } from "near-sdk-as";
import { PlayerData, PetToken, PetBaseData } from "./pp_types";
import { AccountId, TokenId } from "../../utils";
import { PxBalance } from "./utils";


export const playerRegistry = new PersistentMap<AccountId, PlayerData>('z');
export const rewards = new PersistentMap<AccountId, u128>('j');

//each individual pet-token, containing level and so on
export const petTokenRegistry = new PersistentMap<TokenId, PetToken>('x');

//account egg balance
export const eggRegistry = new PersistentMap<AccountId, PxBalance>('e');

//base stats pet information
export const petBaseRegistry = new PersistentMap<u32, PetBaseData>('q');
