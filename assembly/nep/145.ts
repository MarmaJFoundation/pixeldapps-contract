import { context, u128 } from "near-sdk-as";
import { BANK_ACCOUNT, sendNear } from "../utils";
import { ft_transfer_internal_impl, tokenRegistry } from "./141";

@nearBindgen
export class StorageBalance {

    constructor(
        public total: string,
        public available: string) {
    }
}

@nearBindgen
export class StorageBalanceBounds {

    constructor(
        public min: string,
        public max: string) {
    }
}

export function storage_deposit_impl(account_id: string = context.predecessor, registration_only: boolean = true): StorageBalance {

    const balance = storage_balance_of_impl(account_id);
    balance.total = "0";
    balance.available = "0";

    if (context.attachedDeposit > u128.Zero) {
        sendNear(context.predecessor, context.attachedDeposit);
    }

    return balance;
}

export function storage_unregister_impl(force: boolean = false): boolean {
    oneYocto();
    assert(force, "This method can only be called with force = true. Warning: All tokens will be burned and are lost.");
    if (!tokenRegistry.contains(context.predecessor)) {
        return false;
    }

    const balance = tokenRegistry.getSome(context.predecessor);
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, balance.toString(), null);
    tokenRegistry.delete(context.predecessor);
    return true;
}


export function storage_balance_bounds_impl(): StorageBalanceBounds {
    return new StorageBalanceBounds("0", "0");
}


export function storage_balance_of_impl(account_id: string): StorageBalance {
    return new StorageBalance("0", "0");
}