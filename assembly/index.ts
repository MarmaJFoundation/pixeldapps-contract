import { u128, context, storage, logging, PersistentSet } from 'near-sdk-as'
import { _onlyContractOwner, _onlyPxDapps, _onlyTestNet } from './asserts'
import { playerRegistry, petTokenRegistry, petBaseRegistry } from './pixelpets/helper/storage_manager';
import { ft_balance_of_impl, ft_resolve_transfer_impl, ft_total_supply_impl, ft_transfer_call_impl, ft_transfer_internal_impl, tokenRegistry } from './nep/141';
import { StorageBalance, StorageBalanceBounds, storage_balance_bounds_impl, storage_balance_of_impl, storage_deposit_impl, storage_unregister_impl } from './nep/145';
import { ft_metadata_impl, FungibleTokenMetadata } from './nep/148';
import { buy_egg_impl, custom_balance_of_impl } from './pixelpets/eggs';
import { FightPlayerResult, save_fight_result_impl } from './pixelpets/fight';
import { get_player_data_impl, register_player_impl, open_egg_impl, train_pet_impl, hatch_egg_impl, claim_sungen_reward_impl, refill_fight_balance_impl, give_pet_test_impl, set_player_rating_impl } from './pixelpets/game';
import { cancel_offer_pet_impl, evolve_pet_impl, marketplace_buy_impl, offer_pet_impl } from './pixelpets/marketplace';
import { insert_update_pet_impl } from './pixelpets/pets';
import { AccountData, PetBaseData, PetToken, RarityType } from './pixelpets/helper/pp_types';
import { EggSupply, get_egg_supply_impl, set_egg_supply_impl, reward_history } from './presale/presale';
import { CONTRACT_OWNER, NEAR_150, NEAR_200, ONE_NEAR, TokenId } from './utils'
import { get_pets_by_ids_impl, merge_pets_impl, release_pet_impl } from './pixelpets/helper/pettoken_storage';
import { PxBalanceWithToken } from './pixelpets/helper/utils';

/**************************/
/* DATA TYPES AND STORAGE */
/**************************/

// export function initToken(): void {
//   _onlyContractOwner();
//   assert(!tokenRegistry.contains(CONTRACT_OWNER), ERR_TOKEN_ALREADY_MINTED);
//   tokenRegistry.set(CONTRACT_OWNER, TOTAL_SUPPLY);
// }

//Pixelpets
export function get_player_data(account_id: string): AccountData {
    return get_player_data_impl(account_id);
}

export function get_pets_by_ids(pet_ids: string[]): PetToken[] {
    return get_pets_by_ids_impl(pet_ids);
}

export function register_player(): void {
    register_player_impl();
}

export function is_player_registered(account_id: string): bool {
    return playerRegistry.contains(account_id);
}

export function set_player_rating(account_id: string, new_rating: u16): void {
    set_player_rating_impl(account_id, new_rating);
}

export function claim_sungen_reward(): u64 {
    return claim_sungen_reward_impl();
}

export function hatch_egg(rarity: RarityType): u64 {
    return hatch_egg_impl(rarity) / 1000 / 1000;
}

export function open_egg(): PetToken {
    return open_egg_impl();
}

export function train_pet(token_id: TokenId): u64 {
    return train_pet_impl(token_id);
}

export function refill_fight_balance(): void {
    refill_fight_balance_impl();
}

export function insert_update_pet(petdata: PetBaseData): void {
    insert_update_pet_impl(petdata);
}

export function get_pet_base_data(index: u32): PetBaseData {
    return petBaseRegistry.getSome(index);
}

export function get_pet_token_data(token_id: string): PetToken {
    return petTokenRegistry.getSome(token_id);
}

export function offer_pet(token_id: TokenId, price: string): void {
    offer_pet_impl(token_id, price);
}

export function cancel_offer_pet(token_id: TokenId): void {
    cancel_offer_pet_impl(token_id);
}

export function save_fight_result(result: FightPlayerResult): void {
    save_fight_result_impl(result);
}

export function get_sungen(): string {
    return storage.getSome<string>("sungen");
}

export function buy_egg(egg_type: string): void {
    buy_egg_impl(egg_type);
}

export function marketplace_buy(token_id: string, owner: string, buyer: string, price: string): void {
    marketplace_buy_impl(token_id, owner, buyer, price);
}

export function evolve_pet(token_id: string): void {
    evolve_pet_impl(token_id);
}

export function release_pet(token_id: string): void {
    release_pet_impl(token_id);
}

export function merge_pets(improved_token_id: string, removed_token_id: string): u32 {
    return merge_pets_impl(improved_token_id, removed_token_id);
}

//EGG SUPPLY 
export function get_egg_supply(): EggSupply {
    return get_egg_supply_impl();
}

export function set_egg_supply(egg_type: string, supply: u32): void {
    _onlyPxDapps();
    set_egg_supply_impl(egg_type, supply);
}

//CORE NEP-141
export function ft_transfer(receiver_id: string, amount: string, memo: string | null = null): void {
    oneYocto();
    ft_transfer_internal_impl(context.predecessor, receiver_id, amount, memo);
}

export function ft_transfer_call(receiver_id: string, amount: string, msg: string, memo: string | null = null): void {
    ft_transfer_call_impl(receiver_id, amount, msg, memo);
}

export function ft_resolve_transfer(sender_id: string, receiver_id: string, amount: string): string {
    return ft_resolve_transfer_impl(sender_id, receiver_id, amount);
}

export function ft_total_supply(): string {
    return ft_total_supply_impl();
}

export function ft_balance_of(account_id: string): string {
    return ft_balance_of_impl(account_id);
}


// STORAGE NEP-145
export function storage_deposit(account_id: string = context.predecessor, registration_only: boolean = false): StorageBalance {
    return storage_deposit_impl(account_id, registration_only);
}

export function storage_unregister(force: boolean): boolean {
    return storage_unregister_impl(force);
}

export function storage_balance_bounds(): StorageBalanceBounds {
    return storage_balance_bounds_impl();
}

export function storage_balance_of(account_id: string): StorageBalance | null {
    return storage_balance_of_impl(account_id);
}

// METADATA NEP-148
export function ft_metadata(): FungibleTokenMetadata {
    return ft_metadata_impl();
}

//CUSTOM Pixelpets Eggs
export function custom_balance_of(account_id: string): PxBalanceWithToken {
    return custom_balance_of_impl(account_id);
}

@nearBindgen
export class TokenRewards {
    public receiver_id: string;
    public pixeltoken: string;
}

//Reward distribution
export function reward_tokens(rewards: TokenRewards[], reason: string): void {
    _onlyPxDapps();
    //assert(rewards.length <= 30, "Too many users");
    assert(!reward_history.contains(reason), "Already rewarded");
    let balanceOfSender = tokenRegistry.getSome(CONTRACT_OWNER);
    let rewardedTotal = u128.Zero;

    for (let i = 0; i < rewards.length; i++) {
        const convertedTokens = rewards[i].pixeltoken.substr(0, rewards[i].pixeltoken.length - 6);
        logging.log("Sending " + convertedTokens + " Pixeltoken to " + rewards[i].receiver_id);

        const convertedAmount = u128.from(rewards[i].pixeltoken);
        const balanceOfReceiver = tokenRegistry.get(rewards[i].receiver_id, u128.Zero)!;

        const new_balanceOfReceiver = u128.add(balanceOfReceiver, convertedAmount);
        balanceOfSender = u128.sub(balanceOfSender, convertedAmount);
        rewardedTotal = u128.add(rewardedTotal, convertedAmount);

        tokenRegistry.set(rewards[i].receiver_id, new_balanceOfReceiver);
    }

    tokenRegistry.set(CONTRACT_OWNER, balanceOfSender);
    reward_history.set(reason, rewardedTotal.toString());
    logging.log("Rewarded total: " + rewardedTotal.toString().substr(0, rewardedTotal.toString().length - 6));
}

/*
 * **************************************************
 * ******************* CRYPTOHERO *******************
 * **************************************************
 */

import { ch_claim_titan_reward_impl, ch_get_player_data_impl, ch_is_player_registered_impl, ch_refill_fight_balance_impl, ch_register_player_impl, ch_set_fightpoints_impl, ch_unregister_player_impl } from './cryptohero/game';
import { ch_character_buy_potion_impl, ch_get_characters_by_ids_impl, ch_unlock_character_impl } from './cryptohero/helper/character_storage';
import { ch_delete_item_impl, ch_get_items_by_ids_impl, ch_generate_item_impl } from './cryptohero/helper/itemtoken_storage';
import { ch_save_dungeon_result_impl } from './cryptohero/dungeon';
import { ch_buy_item_impl, ch_cancel_offer_item_impl, ch_offer_item_impl } from './cryptohero/marketplace';
import { AccountId, CharacterId } from './utils'
import { ChAccountData, ChCharacterData, ChClassType, ChItemToken, ChItemType, ChPotionData, ChPotionType, ChRaidInfo, ChRarityType, ChTitanReward, DungeonInfo, PxBalanceCH } from './cryptohero/helper/ch_types';
import { ch_forge_items_impl } from './cryptohero/forge';
import { ch_delete_raid_impl } from './cryptohero/helper/raid_storage';
import { ch_save_raid_result_tmp_impl } from './cryptohero/raid';
import { ch_add_lootbox_impl, ch_custom_balance_of_impl, ch_open_lootbox_impl } from './cryptohero/helper/ch_lootbox_titan';

/*
 * players
 */

export function ch_register_player(): void {
    ch_register_player_impl();
}

export function ch_is_player_registered(account_id: AccountId): bool {
    return ch_is_player_registered_impl(account_id);
}

export function ch_get_player_data(account_id: AccountId): ChAccountData {
    return ch_get_player_data_impl(account_id);
}

/*
 * characters
 */

export function ch_unlock_character(class_type: ChClassType): void {
    ch_unlock_character_impl(class_type);
}

export function ch_get_characters_by_ids(character_ids: CharacterId[]): ChCharacterData[] {
    return ch_get_characters_by_ids_impl(character_ids);
}

export function ch_character_buy_potion(class_type: ChClassType, potion_type: ChPotionType): ChPotionData | null {
    return ch_character_buy_potion_impl(class_type, potion_type);
}

/*
 * items
 */

export function ch_get_items_by_ids(token_ids: TokenId[]): ChItemToken[] {
    return ch_get_items_by_ids_impl(token_ids);
}

export function ch_offer_item(token_id: TokenId, price: string): void {
    ch_offer_item_impl(token_id, price);
}

export function ch_cancel_offer_item(token_id: TokenId): void {
    ch_cancel_offer_item_impl(token_id);
}

export function ch_buy_item(token_id: TokenId, owner: AccountId, buyer: AccountId, price: string): void {
    ch_buy_item_impl(token_id, owner, buyer, price);
}

export function ch_delete_item(token_id: TokenId): void {
    ch_delete_item_impl(token_id);
}

export function ch_forge_items(left_token_id: TokenId, right_token_id: TokenId): ChItemToken | null {
    return ch_forge_items_impl(left_token_id, right_token_id);
}

/*
 * titan
 */

export function ch_claim_titan_reward(): ChTitanReward {
    return ch_claim_titan_reward_impl();
}

/*
 * fight balance
 */

export function ch_refill_fight_balance(): void {
    ch_refill_fight_balance_impl();
}

/*
 * dungeon
 */

export function ch_save_dungeon_result(result: DungeonInfo): TokenId {
    return ch_save_dungeon_result_impl(result);
}

/*
 * raid
 */

// while we're storing raid groups in mongodb
// we'd still need to set character injured and decrement fight points
export function ch_save_raid_result_tmp(result: ChRaidInfo): void {
    ch_save_raid_result_tmp_impl(result);
}

/*
 * missing for release
 */

export function ch_open_presale_box(account_id: AccountId, item1: ChItemToken, item2: ChItemToken): void {
    ch_open_lootbox_impl(account_id, item1, item2);
}

export function ch_add_presale_box(account_id: AccountId, rarity_type: ChRarityType): void {
    ch_add_lootbox_impl(account_id, rarity_type);
}

export function ch_custom_balance_of(account_id: AccountId): PxBalanceCH {
    return ch_custom_balance_of_impl(account_id);
}

/*
 * testnet
 */

export function ch_unregister_player(): void {
    const account_id = context.predecessor;
    ch_unregister_player_impl(account_id);
}

export function ch_unregister_player_2(account_id: AccountId): void {
    ch_unregister_player_impl(account_id);
}

export function ch_generate_item(account_id: AccountId, item_type: ChItemType, rarity_type: ChRarityType): void {
    ch_generate_item_impl(account_id, item_type, rarity_type);
}

export function ch_delete_raid(account_id: AccountId, week_code: string): void {
    ch_delete_raid_impl(account_id, week_code);
}

export function ch_set_fightpoints(account_id: AccountId, value: u16): void {
    ch_set_fightpoints_impl(account_id, value);
}

/*
 * test commands
 */

/*
 * **************************************************
 * **************** CHAINTEAMTACTICS ****************
 * **************************************************
 */

import { ctt_get_player_data_impl, ctt_is_player_registered_impl, ctt_register_account_impl, ctt_register_player_impl, ctt_unregister_player_impl } from './chainteamtactics/game';
import { CttAccountData, CttBetTierTypes, CttFightResult, CttUnitBaseData, CttUnitToken, CttUnitType, PxBalanceCTT } from './chainteamtactics/helper/ctt_types';
import { ctt_get_unit_base_impl, ctt_insert_update_unit_impl } from './chainteamtactics/units';
import { ctt_add_unit_to_player_intern, ctt_ensure_units_threshold, ctt_get_units_by_ids_impl, get_avg_power_modifier, get_unittype } from './chainteamtactics/helper/unittoken_storage';
import { ctt_buy_unit_impl, ctt_cancel_offer_unit_impl, ctt_offer_unit_impl } from './chainteamtactics/marketplace';
import { ctt_create_or_join_fight_impl, ctt_refund_room_players_impl, ctt_save_fight_result_impl } from './chainteamtactics/fight';
import { cttPlayerRegistry, cttUnitTokenRegistry } from './chainteamtactics/helper/storage_manager';
import { NFTContractMetadata, nft_metadata_impl, nft_supply_for_owner_impl, nft_tokens_for_owner_impl, nft_transfer_impl, TokenMetadata } from './chainteamtactics/helper/ctt_nep';
import { ctt_custom_balance_of_impl } from './chainteamtactics/helper/utils';

/*
 * players
 */

export function ctt_is_player_registered(account_id: AccountId): bool {
    return ctt_is_player_registered_impl(account_id);
}

export function ctt_register_player(): void {
    ctt_register_player_impl();
}

export function ctt_get_player_data(account_id: AccountId): CttAccountData {
    return ctt_get_player_data_impl(account_id);
}

/*
 * units
 */

export function ctt_get_units_by_ids(token_ids: TokenId[]): CttUnitToken[] {
    return ctt_get_units_by_ids_impl(token_ids);
}

export function ctt_offer_unit(token_id: TokenId, price: string): void {
    ctt_offer_unit_impl(token_id, price);
}

export function ctt_cancel_offer_unit(token_id: TokenId): void {
    ctt_cancel_offer_unit_impl(token_id);
}

export function ctt_buy_unit(token_id: TokenId, owner: AccountId, buyer: AccountId, price: string): void {
    ctt_buy_unit_impl(token_id, owner, buyer, price);
}



export function ctt_insert_update_unit(unitdata: CttUnitBaseData): void {
    ctt_insert_update_unit_impl(unitdata);
}

export function ctt_get_unit_base(unit_type: CttUnitType): CttUnitBaseData {
    return ctt_get_unit_base_impl(unit_type);
}

/*
 * testnet
 */

export function ctt_unregister_player(account_id: AccountId): void {
    _onlyTestNet();
    ctt_unregister_player_impl(account_id);
}

/*
 * minting - delete after minting is done
 */


@nearBindgen
class CttMint {
    public a: CttUnitType;
    public b: u16;
    public c: u16;
    public d: u16;
    public e: u16;
}


@nearBindgen
class CttMintsupply {
    public wl: u32;
    public ps: u32;
    public mint: u32;
}

export function ctt_custom_balance_of(account_id: AccountId): PxBalanceCTT {
    return ctt_custom_balance_of_impl(account_id);
}

export function get_mint_supply(): CttMintsupply {
    return {
        wl: storage.getPrimitive<u32>("ctt_wl_count", 0),
        ps: storage.getPrimitive<u32>("ctt_ps_count", 0),
        mint: storage.getPrimitive<u32>("ctt_mint_count", 0)
    } as CttMintsupply;
}

function ctt_wl_mint_counter_inc(): u32 {
    const counter_key: string = "ctt_wl_count";
    const count = storage.getPrimitive<u32>(counter_key, 0);
    if (count >= 500) {
        throw "WL Mint count exceeded";
    }
    storage.set(counter_key, count + 1);
    return count;
}

function ctt_ps_mint_counter_inc(): u32 {
    const counter_key: string = "ctt_ps_count";
    const count = storage.getPrimitive<u32>(counter_key, 0);
    if (count >= 1000) {
        throw "Presale Mint count exceeded";
    }
    storage.set(counter_key, count + 1);
    return count;
}

function ctt_mint_counter_inc(): u32 {
    const counter_key: string = "ctt_mint_count";
    const count = storage.getPrimitive<u32>(counter_key, 0);
    if (count >= 5200) {
        throw "Mint count exceeded";
    }
    storage.set(counter_key, count + 1);
    return count;
}

function ctt_mint_total_counter_inc(): u32 {
    const counter_key: string = "ctt_mint_total";
    const count = storage.getPrimitive<u32>(counter_key, 0);
    assert(count < 7001, "Mint count exceeded");
    storage.set(counter_key, count + 1);
    return count;
}

export function ctt_add_wl(account_id: string): void {
    _onlyPxDapps();
    const wl_set = new PersistentSet<TokenId>('mint_wl');
    wl_set.add(account_id);
}

export function ctt_is_wl_user(account_id: string): bool {
    const wl_set = new PersistentSet<TokenId>('mint_wl');
    return wl_set.has(account_id);
}

function ctt_assert_is_wl_user(account_id: string): void {
    const wl_set = new PersistentSet<TokenId>('mint_wl');
    assert(wl_set.has(account_id), "account not on whitelist");
}


export function ctt_fill(tokens: CttMint[]): void {
    _onlyPxDapps();
    for (let i = 0; i < tokens.length; i++) {
        cttUnitTokenRegistry.set(tokens[i].a.toString(), {
            token_id: tokens[i].a.toString(),
            unit_type: tokens[i].b,
            damage_mod: tokens[i].c,
            speed_mod: tokens[i].d,
            health_mod: tokens[i].e,
            owner: ""
        } as CttUnitToken)
    }
}

export function nft_mint(type: String): void {
    if (!ctt_is_player_registered_impl(context.predecessor)) {
        ctt_register_player_impl();
    }
    ctt_ensure_units_threshold(context.predecessor);
    if (type == "wl") {
        ctt_assert_is_wl_user(context.predecessor);
        assert(u128.eq(context.attachedDeposit, ONE_NEAR), "Not enough NEAR attached");
        ctt_wl_mint_counter_inc();
    } else if (type == "ps") {
        assert(u128.eq(context.attachedDeposit, NEAR_150), "Not enough NEAR attached");
        ctt_ps_mint_counter_inc();
    } else {
        assert(u128.eq(context.attachedDeposit, NEAR_200), "Not enough NEAR attached");
        ctt_mint_counter_inc();
    }
    const token_id = ctt_mint_total_counter_inc();
    ctt_add_unit_to_player_intern(context.predecessor, token_id.toString());
}

export function nft_supply_for_owner(account_id: string): string {
    return nft_supply_for_owner_impl(account_id);

}

export function nft_tokens_for_owner(account_id: string, from_index: string = "0", limit: u32 = 20): CttUnitToken[] {
    return nft_tokens_for_owner_impl(account_id, from_index, limit);
}

export function nft_metadata(): NFTContractMetadata {
    return nft_metadata_impl();
}

export function nft_transfer(receiver_id: string, token_id: string): void {
    oneYocto();

    if (!ctt_is_player_registered_impl(receiver_id)) {
        ctt_register_account_impl(receiver_id);
    }

    nft_transfer_impl(context.predecessor, receiver_id, token_id);
}


export function nft_token(token_id: string): CttUnitToken | null {
    const token = cttUnitTokenRegistry.getSome(token_id);
    token.metadata = new TokenMetadata("#" + token.token_id + " - " + get_unittype(token.unit_type) + " | Power: " + get_avg_power_modifier(token).toString(), "https://ecosystem.pixeldapps.co/ctt/units/" + token.token_id.toString() + ".png", null);
    token.owner_id = token.owner
    token.metadata.reference = null;
    return token;
}

export function nft_holder(token_id: string): String | null {
    const token = cttUnitTokenRegistry.get(token_id, null)!;
    if (token) {
        return token.owner;
    }
    return null
}

export function nft_tokens_for_owner_set(account_id: string): string[] {
    return cttPlayerRegistry.getSome(account_id).unit_ids;
}