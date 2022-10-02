import { u128 } from "near-sdk-as";
import { context, logging, storage } from "near-sdk-core";
import { randomNumber, TokenId } from "../../utils";
import { generate_powerlevel } from "../pets";
import { PetBaseData, PetToken, PlayerData, RarityType, StateType } from "./pp_types";
import { petBaseRegistry, petTokenRegistry, playerRegistry } from "./storage_manager";

export function get_pets_by_ids_impl(ids: String[]): PetToken[] {

    //@ts-ignore
    const pets = new Array<PetToken>(ids.length);
    for (let i = 0; i < ids.length; i++) {
        pets[i] = petTokenRegistry.getSome(ids[i].toString());
    }
    return pets;
}

export function create_pet(receiver_id: string, pet: PetToken): TokenId {
    const token_id = get_pettoken_count_and_increase().toString();
    pet.token_id = token_id;
    petTokenRegistry.set(token_id, pet);
    add_pet_to_player(receiver_id, pet)
    return token_id;
}

export function add_pet_to_player(account_id: string, pet: PetToken): PetToken {
    const player = playerRegistry.getSome(account_id);

    player.pet_ids.push(pet.token_id);
    playerRegistry.set(account_id, player);

    const pettoken = petTokenRegistry.getSome(pet.token_id);
    pettoken.owner = account_id;
    petTokenRegistry.set(pet.token_id, pettoken);
    return pettoken;
}

export function release_pet_impl(token_id: TokenId): void {
    const pettoken = petTokenRegistry.getSome(token_id);
    assert(pettoken.owner == context.predecessor, "You don't own this pet");
    remove_pet_from_player(context.predecessor, token_id);
    petTokenRegistry.delete(token_id);
}

export function remove_pet_from_player(account_id: string, token_id: TokenId): void {
    const player = playerRegistry.getSome(account_id);
    const index = player.pet_ids.indexOf(token_id);
    assert(index != -1, "You don't own this pet");
    player.pet_ids.splice(index, 1);
    playerRegistry.set(account_id, player);
}

export function get_pettoken_count_and_increase(): u32 {
    const count = storage.getPrimitive<u32>("token_count", 0);
    storage.set("token_count", count + 1);
    return count;
}

export function lessThan28Pets(player: PlayerData): void {
    assert(player.pet_ids.length < 28, "You can only own 28 pets at the same time");
}

export function create_random_pet(receiver_id: string, rarity: RarityType, fixed_rarity: bool = false): PetToken {
    const token_id = get_pettoken_count_and_increase().toString();

    let creature_type = get_normal_pet();
    let dropchance_category = randomNumber(0, 100);

    logging.log("drop_dice: " + dropchance_category.toString());

    if (dropchance_category <= 2) {
        creature_type = get_very_rare_pet();

    }
    else if (dropchance_category <= 15) {
        creature_type = get_rare_pet();
    }

    if (rarity < RarityType.Legendary && !fixed_rarity) {
        const number = randomNumber(0, 1000);
        logging.log("rarity_dice: " + number.toString());
        if (number > 994) {
            rarity = rarity + 1;
        }
    }

    const pet = { token_id: token_id, xp: 0, owner: context.predecessor, price: u128.Zero, train_level: 1, pet_type: u8(creature_type), rarity: rarity, power_level: generate_powerlevel(rarity), level: 1, state: StateType.Training, state_timer: 0 } as PetToken
    petTokenRegistry.set(token_id, pet);
    const new_pet = add_pet_to_player(receiver_id, pet)
    return new_pet;
}

export function get_normal_pet(): u32 {
    const normal_ids = [2, 5, 11, 14, 15, 19, 21, 23, 24, 25, 28, 32, 33, 35, 42, 49, 52, 54, 56, 60, 61, 70, 73, 76];
    const ranNumber: u32 = randomNumber(0, normal_ids.length - 1);
    return normal_ids[ranNumber];
}

export function get_rare_pet(): u32 {
    const rare_ids = [9, 10, 18, 29, 38, 40, 45, 46, 50, 79];
    const ranNumber: u32 = randomNumber(0, rare_ids.length - 1);
    return rare_ids[ranNumber];
}

export function get_very_rare_pet(): u32 {
    const very_rare_ids = [4, 8];
    const ranNumber: u32 = randomNumber(0, very_rare_ids.length - 1);
    return very_rare_ids[ranNumber];
}

export function merge_pets_impl(improved_token_id: TokenId, removed_token_id: TokenId): u32 {
    assert(improved_token_id != removed_token_id, "Can't merge a pet with itself");

    const improved_token = petTokenRegistry.getSome(improved_token_id);

    assert(improved_token.owner == context.predecessor, "You don't own this pet");
    assert(improved_token.state_timer < context.blockTimestamp, "Pet is busy");

    const removed_token = petTokenRegistry.getSome(removed_token_id);

    assert(removed_token.owner == context.predecessor, "You don't own this pet");
    assert(removed_token.state_timer < context.blockTimestamp, "Pet is busy");

    _assert_merge_pet_types(improved_token.pet_type, removed_token.pet_type);
    assert(improved_token.rarity == removed_token.rarity, "Pet's rarity should be the same");
    assert(improved_token.power_level < 100 || improved_token.rarity < RarityType.Legendary, "Pet's rarity can't be higher than Legendary");

    const improve_plvl_by = Math.floor(removed_token.power_level / 30) + 1;
    if (improved_token.power_level < 100) {
        improved_token.power_level = u8(Math.min(improved_token.power_level + improve_plvl_by, 100));
    }
    else {
        improved_token.power_level = u8(80 + (improve_plvl_by * 2));
        improved_token.rarity++;
    }
    petTokenRegistry.set(improved_token.token_id, improved_token);

    remove_pet_from_player(context.predecessor, removed_token.token_id);
    petTokenRegistry.delete(removed_token.token_id);

    return improved_token.power_level;
}

function _assert_merge_pet_types(improved_type: u8, removed_type: u8): void {
    if (improved_type != removed_type) {// same type - 12gas
        assert(
            _test_pet_evolutions(improved_type, removed_type) || // improved pet is a pre-evolution of removed pet - 14gas(improved:evo1, removed:evo3)
            _test_pet_evolutions(removed_type, improved_type), // improved pet is a post-evolution of removed pet - 15gas(improved:evo3, removed:evo1)
            "Can't merge different pet types"
        );
    }
}

function _test_pet_evolutions(base_type: u8, test_type: u8): bool {
    let petbase: PetBaseData = petBaseRegistry.getSome(base_type);
    let base_evol_to: u8 = petbase.evolution_to;

    while (base_evol_to != 0) {
        if (base_evol_to == test_type) {
            return true;
        }
        petbase = petBaseRegistry.getSome(base_evol_to);
        base_evol_to = petbase.evolution_to;
    }

    return false;
}




