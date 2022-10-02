import { u128, context, PersistentMap, logging, ContractPromise, env } from "near-sdk-as";
import { ERR_INVALID_AMOUNT, ERR_INSUFFICIENT_BALANCE, ERR_INVALID_ACCOUNT } from "../asserts";
import { AccountId, CONTRACT_OWNER, CUSTODY_ACCOUNT, is_testnet_env, TOTAL_SUPPLY, XCC_GAS_ON_SELF_USE, XCC_GAS_RESOLVE } from "../utils";


export const tokenRegistry = new PersistentMap<AccountId, u128>('p');

export function ft_transfer_internal_impl(sender_id: string, receiver_id: string, amount: string, memo: string | null): void {
    assert(env.isValidAccountID(receiver_id), ERR_INVALID_ACCOUNT);

    const convertedAmount = u128.from(amount);

    assert(sender_id != receiver_id, "Sender and receiver should be different");
    assert(convertedAmount > u128.Zero, ERR_INVALID_AMOUNT);

    const balanceOfSender = tokenRegistry.getSome(sender_id);
    assert(balanceOfSender >= convertedAmount, ERR_INSUFFICIENT_BALANCE)
    const balanceOfReceiver = tokenRegistry.get(receiver_id, u128.Zero)!;

    const new_balanceOfSender = u128.sub(balanceOfSender, convertedAmount)
    const new_balanceOfReceiver = u128.add(balanceOfReceiver, convertedAmount)

    tokenRegistry.set(sender_id, new_balanceOfSender);
    tokenRegistry.set(receiver_id, new_balanceOfReceiver);

    if (is_testnet_env()) {
        logging.log(`Transfer ${amount} from @${sender_id} to @${receiver_id}`);
    }

    if (memo) {
        logging.log("Memo: " + memo);
    }
}


@nearBindgen
export class FTT_CALL {
    public sender_id: string;
    public amount: string;
    public msg: string;
}

@nearBindgen
export class FTT_CALLBACK {
    public sender_id: string;
    public receiver_id: string;
    public amount: string;
}

export function ft_transfer_call_impl(receiver_id: string, amount: string, msg: string, memo: string | null): void {
    oneYocto();

    assert(["v2.ref-finance.near", "v2.ref-farming.near", "boostfarm.ref-labs.near"].includes(receiver_id), "The targeted contract is not on the whitelist")
    const sender_id = context.predecessor;

    ft_transfer_internal_impl(sender_id, receiver_id, amount, memo);

    ContractPromise.create<FTT_CALL>(
        receiver_id,
        "ft_on_transfer",
        { sender_id, amount, msg },
        context.prepaidGas - XCC_GAS_ON_SELF_USE - XCC_GAS_RESOLVE
    ).then<FTT_CALLBACK>(
        context.contractName,
        "ft_resolve_transfer",
        {
            sender_id, receiver_id, amount
        },
        XCC_GAS_RESOLVE
    ).returnAsResult();

}

//ft_on_transfer
//return unused amount

//returns the used amount
export function ft_resolve_transfer_impl(sender_id: string, receiver_id: string, amount: string): string {
    const results = ContractPromise.getResults();
    assert(results.length == 1, "Cross contract chain should be 1");
    assert(context.predecessor == CONTRACT_OWNER, "Method ft_resolve_transfer is private");
    assert(!results[0].pending, "Error, transaction still pending. This should not happen.");
    let refundAddress = CUSTODY_ACCOUNT;
    let unusedAmount = "0";

    if (results[0].failed) {
        logging.log("Failed transaction, refund all");
        unusedAmount = amount;
        refundAddress = sender_id;
    }
    else {
        unusedAmount = results[0].decode<string>(); //unused amount provided by on_transfer method
    }

    const amountConverted = u128.from(amount);
    let unusedAmountConverted = u128.from(unusedAmount);

    if (unusedAmountConverted > u128.Zero) {
        //check balance of receiver and get min value
        const receiver_balance = tokenRegistry.get(receiver_id, u128.Zero)!;
        if (u128.gt(unusedAmountConverted, receiver_balance)) {
            unusedAmountConverted = receiver_balance; //can't refund more than total balance
        }
        const usedAmount = u128.sub(amountConverted, unusedAmountConverted).toString();

        if (!tokenRegistry.contains(sender_id)) {
            logging.log("Refund not possible, account deleted. Refund to PXT-Bank.");
            ft_transfer_internal_impl(receiver_id, refundAddress, unusedAmountConverted.toString(), "account not found");
        }
        else {
            logging.log("Error, refund to: " + refundAddress);
            ft_transfer_internal_impl(receiver_id, refundAddress, unusedAmountConverted.toString(), null);
        }
        return usedAmount;
    }
    return amount;
}


export function ft_total_supply_impl(): string {
    return TOTAL_SUPPLY.toString();
}

export function ft_balance_of_impl(account_id: string): string {
    const balance = tokenRegistry.get(account_id, u128.Zero)!;
    return balance.toString();
}

