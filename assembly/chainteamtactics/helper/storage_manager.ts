import { PersistentMap, PersistentUnorderedMap, u128 } from "near-sdk-as";
import { AccountId, TokenId } from "../../utils";
import { CttPlayerData, CttUnitBaseData, CttUnitToken } from "./ctt_types";

export const cttPlayerRegistry = new PersistentMap<AccountId, CttPlayerData>('r');
export const cttUnitTokenRegistry = new PersistentUnorderedMap<TokenId, CttUnitToken>('u');
export const cttMarketplaceRegistry = new PersistentMap<TokenId, u128>('u2');
export const cttUnitBaseRegistry = new PersistentMap<i32, CttUnitBaseData>('l');