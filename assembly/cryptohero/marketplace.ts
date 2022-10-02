import { context } from "near-sdk-as";
import { logging, u128 } from "near-sdk-core";
import { ft_transfer_internal_impl } from "../nep/141";
import { AccountId, is_testnet_env, ONE_DAY_IN_NS, TokenId, BANK_ACCOUNT } from "../utils";
import { ChRarityType } from "./helper/ch_types";
import { ch_ensure_items_threshold, ch_transfer_item } from "./helper/itemtoken_storage";
import { chItemTokenRegistry } from "./helper/storage_manager";

export function ch_offer_item_impl(token_id: TokenId, price: string): void {
    const account_id = context.predecessor;
    const item_token = chItemTokenRegistry.getSome(token_id);

    assert(item_token.owner == account_id, "You don't own this item");
    assert(item_token.price == u128.Zero, "Item is already on sale");

    if(item_token.rarity_type == ChRarityType.Rare || item_token.rarity_type == ChRarityType.Epic || item_token.rarity_type == ChRarityType.Legendary) {
        assert(item_token.cd < context.blockTimestamp, "You need to wait some time till you can resell item"); 
    }

    item_token.price = u128.from(price);

    if(item_token.rarity_type == ChRarityType.Epic) {
        assert(u128.ge(item_token.price, u128.from("50000000")), "Price too low for epic item");
    }

    if(item_token.rarity_type == ChRarityType.Legendary) {
        assert(u128.ge(item_token.price, u128.from("300000000")), "Price too low for legendary item");
    }
    chItemTokenRegistry.set(token_id, item_token);

    if (is_testnet_env()) {
        logging.log(`@${account_id} added item #${token_id} on market with price ${item_token.price}`);
    }
}

export function ch_cancel_offer_item_impl(token_id: TokenId): void {
    const account_id = context.predecessor;
    const item_token = chItemTokenRegistry.getSome(token_id);

    assert(item_token.owner == account_id, "You don't own this item");
    assert(item_token.price != u128.Zero, "Item is not on sale");

    item_token.price = u128.Zero;
    chItemTokenRegistry.set(token_id, item_token);

    if (is_testnet_env()) {
        logging.log(`@${account_id} removed item #${token_id} from market`);
    }
}

export function ch_buy_item_impl(token_id: TokenId, owner: AccountId, buyer: AccountId, price: string): void {
    oneYocto();

    const account_id = context.predecessor;

    ch_ensure_items_threshold(account_id);

    const item_token = chItemTokenRegistry.getSome(token_id);

    assert(item_token.price != u128.Zero, "Item not for sale");
    assert(item_token.price.toString() == price, "Price doesn't match");
    assert(item_token.owner == owner, "Owner doesn't match");
    assert(account_id == buyer, "Buyer doesn't match");


    if(item_token.rarity_type == ChRarityType.Rare) {
        item_token.cd = context.blockTimestamp + (ONE_DAY_IN_NS * 1);
        chItemTokenRegistry.set(item_token.token_id, item_token);
    }

    if(item_token.rarity_type == ChRarityType.Epic) {
        item_token.cd = context.blockTimestamp + (ONE_DAY_IN_NS * 2);
        chItemTokenRegistry.set(item_token.token_id, item_token);
    }

    if(item_token.rarity_type == ChRarityType.Legendary) {
        item_token.cd = context.blockTimestamp + (ONE_DAY_IN_NS * 3);
        chItemTokenRegistry.set(item_token.token_id, item_token);
    }

    logging.log("Total: " + item_token.price.toString());

    const fee = u128.muldiv(item_token.price, u128.from("5"), u128.from("100"));
    const price_minus_fee = u128.sub(item_token.price, fee);

    logging.log("Fee: " + fee.toString());
    logging.log("Sending to seller: " + price_minus_fee.toString());

    if (is_testnet_env()) {
        logging.log(`@${account_id} is buying item #${token_id} from @${owner} by ${item_token.price} (${price_minus_fee} + ${fee} of fee)`);
    }

    ft_transfer_internal_impl(account_id, item_token.owner, price_minus_fee.toString(), null);
    ft_transfer_internal_impl(account_id, BANK_ACCOUNT, fee.toString(), null)

    ch_transfer_item(item_token.owner, account_id, token_id);
}