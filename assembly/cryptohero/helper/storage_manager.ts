import { PersistentMap } from "near-sdk-core";
import { AccountId, CharacterId, is_testnet_env, RaidId, TokenId } from "../../utils";
import { ChCharacterData, ChItemToken, ChPlayerData, ChRaidData, ChSupply } from "./ch_types";

export const chPlayerRegistry = new PersistentMap<AccountId, ChPlayerData>('c');
export const chItemTokenRegistry = new PersistentMap<TokenId, ChItemToken>('d');
export const chLootboxRegistry = new PersistentMap<AccountId, ChSupply>('cl');

export function ch_get_character_registry_by_id(character_id: CharacterId): PersistentMap<CharacterId, ChCharacterData> {
    let prefix: string = 'f';
    if (is_testnet_env()) {// keep testnet working pls
        prefix = character_id;
    }
    const character_registry = new PersistentMap<CharacterId, ChCharacterData>(prefix);
    return character_registry;
}

export function ch_get_raid_registry_by_id(raid_id: RaidId): PersistentMap<RaidId, ChRaidData> {
    const raid_registry = new PersistentMap<RaidId, ChRaidData>(raid_id);
    return raid_registry;
}