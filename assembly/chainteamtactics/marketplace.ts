import { context } from "near-sdk-as";
import { logging, u128 } from "near-sdk-core";
import { ft_transfer_internal_impl } from "../nep/141";
import { AccountId, is_testnet_env, TokenId, BANK_ACCOUNT } from "../utils";
import { cttMarketplaceRegistry, cttUnitTokenRegistry } from "./helper/storage_manager";
import { ctt_ensure_units_threshold, ctt_transfer_unit } from "./helper/unittoken_storage";

export function ctt_offer_unit_impl(token_id: TokenId, price: string): void {
    const account_id = context.predecessor;
    const unit_token = cttUnitTokenRegistry.getSome(token_id);
    const token_price = cttMarketplaceRegistry.get(token_id, u128.Zero)!;

    assert(unit_token.owner == account_id, "You don't own this unit");
    assert(token_price == u128.Zero, "Unit is already on sale");

    unit_token.price = u128.from(price);

    cttUnitTokenRegistry.set(token_id, unit_token);
    cttMarketplaceRegistry.set(token_id, u128.from(price));

    if (is_testnet_env()) {
        logging.log(`@${account_id} added unit #${token_id} on market with price ${token_price}`);
    }
}

export function ctt_cancel_offer_unit_impl(token_id: TokenId): void {
    const account_id = context.predecessor;
    const unit_token = cttUnitTokenRegistry.getSome(token_id);
    const unit_price = cttMarketplaceRegistry.get(token_id, u128.Zero)!;

    assert(unit_token.owner == account_id, "You don't own this unit");
    assert(unit_price != u128.Zero, "Unit is not on sale");

    unit_token.price = u128.Zero;
    cttUnitTokenRegistry.set(token_id, unit_token);
    cttMarketplaceRegistry.delete(token_id);

    if (is_testnet_env()) {
        logging.log(`@${account_id} removed unit #${token_id} from market`);
    }
}

export function ctt_buy_unit_impl(token_id: TokenId, owner: AccountId, buyer: AccountId, price: string): void {
    oneYocto();

    const account_id = context.predecessor;

    ctt_ensure_units_threshold(account_id);

    const unit_token = cttUnitTokenRegistry.getSome(token_id);
    const unit_price = cttMarketplaceRegistry.get(token_id, u128.Zero)!;

    assert(unit_price != u128.Zero, "Unit not for sale");
    assert(unit_token.owner == owner, "Owner doesn't match");
    assert(account_id == buyer, "Buyer doesn't match");

    logging.log("Total: " + unit_price.toString());

    const fee = u128.muldiv(unit_price, u128.from("5"), u128.from("100"));
    const price_minus_fee = u128.sub(unit_price, fee);

    logging.log("Fee: " + fee.toString());
    logging.log("Sending to seller: " + price_minus_fee.toString());

    // if (is_testnet_env()) {
    logging.log(`@${account_id} is buying unit #${token_id} from @${owner} by ${unit_price} (${price_minus_fee} + ${fee} of fee)`);
    //}

    ft_transfer_internal_impl(account_id, unit_token.owner, price_minus_fee.toString(), null);
    ft_transfer_internal_impl(account_id, BANK_ACCOUNT, fee.toString(), null)

    ctt_transfer_unit(unit_token.owner, account_id, token_id);
}