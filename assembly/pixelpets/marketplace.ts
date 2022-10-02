import { context, logging, u128 } from "near-sdk-as";
import { petBaseRegistry, petTokenRegistry, playerRegistry } from "./helper/storage_manager";
import { ft_transfer_internal_impl } from "../nep/141";
import { transfer_pet } from "./game";
import { StateType } from "./helper/pp_types";
import { BANK_ACCOUNT, TokenId, toYoctoToken } from "../utils";
import { lessThan28Pets } from "./helper/pettoken_storage";

export function offer_pet_impl(token_id: TokenId, price: string): void {
    const pet_token = petTokenRegistry.getSome(token_id);
    assert(![57, 58, 59].includes(pet_token.pet_type), "You can't sell a starterpet");
    assert(pet_token.owner == context.predecessor, "You don't own this pet")
    pet_token.price = u128.from(price);
    assert(pet_token.state_timer < context.blockTimestamp, "Pet is busy");
    assert(pet_token.state != StateType.ForSale, "Pet is already on sale");
    pet_token.state = StateType.ForSale;
    petTokenRegistry.set(token_id, pet_token);
}

export function cancel_offer_pet_impl(token_id: TokenId): void {
    const pet_token = petTokenRegistry.getSome(token_id);
    assert(pet_token.owner == context.predecessor, "You don't own this pet")
    pet_token.price = u128.Zero;
    assert(pet_token.state == StateType.ForSale, "Pet is not on sale");
    pet_token.state = StateType.Training; //since we don't have something like idling, just set training. State_timer is in the past anyway.
    petTokenRegistry.set(token_id, pet_token);
}

export function marketplace_buy_impl(token_id: string, owner: string, buyer: string, price: string): void {
    oneYocto();
    const player = playerRegistry.getSome(context.predecessor);
    lessThan28Pets(player);
    const pet = petTokenRegistry.getSome(token_id);
    assert(pet.price > u128.Zero, "Pet not for sale");
    assert(pet.price.toString() == price, "Price doesn't match");
    assert(pet.owner == owner, "Owner doesn't match");
    assert(context.predecessor == buyer, "Buyer doesn't match");

    logging.log("Total: " + pet.price.toString());

    const fee = u128.muldiv(pet.price, u128.from("5"), u128.from("100"));
    const price_minus_fee = u128.sub(pet.price, fee);

    logging.log("Fee: " + fee.toString());
    logging.log("Sending to seller: " + price_minus_fee.toString());

    ft_transfer_internal_impl(context.predecessor, pet.owner, price_minus_fee.toString(), null);
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, fee.toString(), null)
    transfer_pet(pet.owner, context.predecessor, token_id, true);
}

export function evolve_pet_impl(token_id: TokenId): void {
    const pet = petTokenRegistry.getSome(token_id);
    assert(pet.owner == context.predecessor, "You don't own this pet");
    const pettype = petBaseRegistry.getSome(pet.pet_type);
    assert(pettype.evolution_to != 0, "No evolution possible");
    if (pettype.evolution == 1) {
        assert(pet.level > 39, "pet level not high enough")
    }
    else if (pettype.evolution == 2) {
        assert(pet.level > 79, "pet level not high enough")
    }
    pet.pet_type = pettype.evolution_to;

    const evolve_cost = (pettype.evolution) * 50;
    const amount_converted = toYoctoToken(evolve_cost.toString());
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, amount_converted.toString(), null);

    petTokenRegistry.set(token_id, pet);
}