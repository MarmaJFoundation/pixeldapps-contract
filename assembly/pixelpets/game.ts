import { context, logging, storage, u128 } from "near-sdk-as";
import { create_pet, add_pet_to_player, remove_pet_from_player, lessThan28Pets, create_random_pet } from "./helper/pettoken_storage";
import { playerRegistry, petTokenRegistry, eggRegistry } from "./helper/storage_manager";
import { ft_transfer_internal_impl } from "../nep/141";
import { BANK_ACCOUNT, MANAGER_ACCOUNT, nanoToMinuteFactor, randomNumber, sendNear, TokenId, toYoctoToken } from "../utils";
import { add_egg, custom_balance_of_impl } from "./eggs";
import { AccountData, PetToken, PlayerData, RarityType, StateType } from "./helper/pp_types";
import { decrease_pet_level, get_xp_for_level } from "./pets";
import { _onlyPxDapps } from "../asserts";

export function get_player_data_impl(account_id: string): AccountData {
    const playerdata = playerRegistry.getSome(account_id);
    const accountData = new AccountData();
    accountData.playerdata = playerdata;
    accountData.playerdata.hatching.timestamp = accountData.playerdata.hatching.timestamp / 1000 / 1000;
    accountData.balance = custom_balance_of_impl(account_id);
    accountData.owns_sungen = storage.getPrimitive<string>("sungen", "none") == account_id;
    accountData.sungen_timer = storage.getPrimitive<u64>("sungen_timer", 1000) / 1000 / 1000;
    return accountData;
}

export function claim_sungen_reward_impl(): u64 {
    assert(storage.getPrimitive<string>("sungen", "none") == context.predecessor, "You don't own sungen");
    assert(storage.getPrimitive<u64>("sungen_timer", 0) < context.blockTimestamp, "Reward not ready");

    const sungen_cooldown = context.blockTimestamp + (nanoToMinuteFactor * 43200);
    storage.set<u64>("sungen_timer", sungen_cooldown);
    add_egg(context.predecessor, RarityType.Epic);
    return sungen_cooldown / 1000 / 1000;
}


export function train_pet_impl(token_id: TokenId): u64 {

    const pettoken = petTokenRegistry.getSome(token_id);
    const player = playerRegistry.getSome(context.predecessor);
    assert(pettoken.owner == context.predecessor, "You don't own this pet");
    assert(player.train_timer < context.blockTimestamp, "You are already training a pet");
    const blocked_until = context.blockTimestamp + (nanoToMinuteFactor * 60 * 3 * pettoken.train_level);
    player.train_timer = blocked_until;

    assert(pettoken.state_timer < context.blockTimestamp, "Pet is not ready")
    assert(pettoken.train_level < 10, "Traininglevel of pet is at maximum");
    const train_cost = (pettoken.train_level + 1) * 4;
    const amount_converted = toYoctoToken(train_cost.toString());
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, amount_converted.toString(), null);

    pettoken.state = StateType.Training;
    pettoken.state_timer = blocked_until
    pettoken.train_level++;
    petTokenRegistry.set(token_id, pettoken);
    playerRegistry.set(context.predecessor, player);
    return blocked_until / 1000 / 1000;
}

export function refill_fight_balance_impl(): void {
    assert(context.attachedDeposit == u128.from("250000000000000000000000"), "You need to attach 0.25N");
    const player = playerRegistry.getSome(context.predecessor);

    assert(player.fight_balance < 2, "You still have fights left before you need to refill");
    player.fight_balance = player.fight_balance + 100;
    playerRegistry.set(context.predecessor, player);
    const rand = randomNumber(1, 100);
    logging.log("dice: " + rand.toString());
    if (rand < 98) {
        add_egg(context.predecessor, 0);
    }
    else {
        add_egg(context.predecessor, 1);
    }

    sendNear(MANAGER_ACCOUNT, u128.from("230000000000000000000000"));
}

export function hatch_egg_impl(rarity: RarityType): u64 {
    const player = playerRegistry.getSome(context.predecessor);
    assert(player.hatching.rarity == RarityType.None, "You already hatch an egg");

    if (rarity == RarityType.Normal) {
        const eggs = eggRegistry.getSome(context.predecessor);
        assert(eggs.egg_common > 0, "You have not enough common eggs");

        const hatchTime = context.blockTimestamp + (nanoToMinuteFactor * 240);
        player.hatching = { rarity: RarityType.Normal, timestamp: hatchTime }
        playerRegistry.set(context.predecessor, player);

        eggs.egg_common--;
        eggRegistry.set(context.predecessor, eggs);
        return hatchTime;
    }

    if (rarity == RarityType.Rare) {
        const eggs = eggRegistry.getSome(context.predecessor);
        assert(eggs.egg_rare > 0, "You have not enough common eggs");

        const hatchTime = context.blockTimestamp + (nanoToMinuteFactor * 720);
        player.hatching = { rarity: RarityType.Rare, timestamp: hatchTime }
        playerRegistry.set(context.predecessor, player);

        eggs.egg_rare--;
        eggRegistry.set(context.predecessor, eggs);
        return hatchTime;
    }

    if (rarity == RarityType.Epic) {
        const eggs = eggRegistry.getSome(context.predecessor);
        assert(eggs.egg_epic > 0, "You have not enough common eggs");

        const hatchTime = context.blockTimestamp + (nanoToMinuteFactor * 1440);
        player.hatching = { rarity: RarityType.Epic, timestamp: hatchTime }
        playerRegistry.set(context.predecessor, player);

        eggs.egg_epic--;
        eggRegistry.set(context.predecessor, eggs);
        return hatchTime;
    }

    if (rarity == RarityType.Legendary) {
        const eggs = eggRegistry.getSome(context.predecessor);
        assert(eggs.egg_legendary > 0, "You have not enough common eggs");


        const hatchTime = context.blockTimestamp + (nanoToMinuteFactor * 2880);
        player.hatching = { rarity: RarityType.Legendary, timestamp: hatchTime }
        playerRegistry.set(context.predecessor, player);

        eggs.egg_legendary--;
        eggRegistry.set(context.predecessor, eggs);
        return hatchTime;
    }

    throw "Rarity not valid";
}

export function open_egg_impl(): PetToken {
    let player = playerRegistry.getSome(context.predecessor);
    assert(player.hatching.rarity != 4, "You have no egg in hatching currently");

    assert(player.hatching.timestamp < context.blockTimestamp, "Egg not ready yet");
    lessThan28Pets(player);
    const new_pet = create_random_pet(context.predecessor, player.hatching.rarity);

    player = playerRegistry.getSome(context.predecessor);
    player.hatching = { rarity: 4, timestamp: 0 };

    playerRegistry.set(context.predecessor, player);

    return new_pet;
}

export function transfer_pet(sender_id: string, receiver_id: string, token_id: TokenId, decrease_level: bool = false): void {
    const pet_token = petTokenRegistry.getSome(token_id);

    remove_pet_from_player(sender_id, token_id);
    add_pet_to_player(receiver_id, pet_token);

    pet_token.owner = receiver_id;
    pet_token.price = u128.Zero;
    pet_token.state = StateType.Training;

    if (decrease_level) {
        const new_level_data = decrease_pet_level(pet_token.level);
        pet_token.level = new_level_data.ret_lvl;
        pet_token.xp = new_level_data.ret_xp;
    }
    petTokenRegistry.set(token_id, pet_token);
}

export function register_player_impl(): void {
    const account = context.predecessor;
    assert(account.length < 63 && (account.endsWith(".near") || account.endsWith(".testnet")), "Please use a .near account to play Pixelpets.");
    assert(!playerRegistry.contains(account), "Wallet already registered");
    playerRegistry.set(account, new PlayerData());

    const p1 = { owner: account, pet_type: 57, power_level: 80 } as PetToken
    create_pet(account, p1);
    const p2 = { owner: account, pet_type: 58, power_level: 80 } as PetToken
    create_pet(account, p2);
    const p3 = { owner: account, pet_type: 59, power_level: 80 } as PetToken
    create_pet(account, p3);
}

export function set_player_rating_impl(account_id: string, new_rating: u16): void {
    _onlyPxDapps();
    const playerdata = playerRegistry.getSome(account_id);
    playerdata.rating = new_rating;
    playerRegistry.set(account_id, playerdata);
}

/*
 * TESTING
 */
export function give_pet_test_impl(account_id: string, pet_type: u8, pet_rarity: u8, pet_lvl: u8, pet_plvl: u8, pet_tlvl: u8): void {
    assert(playerRegistry.contains(account_id), "Wallet doesn't exists");
    const pet_token = {
      owner: account_id, 
      pet_type: pet_type, 
      rarity: pet_rarity, 
      level: pet_lvl,
      power_level: pet_plvl,
      train_level: pet_tlvl,
      xp: get_xp_for_level(pet_lvl)
    } as PetToken
    create_pet(account_id, pet_token);
}


