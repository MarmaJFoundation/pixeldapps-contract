import { context } from 'near-sdk-as'
import { CONTRACT_OWNER, is_testnet_env, PX_DAPPS_ACCOUNTS, TESTNET_ACCOUNT } from './utils'

/******************/
/* ERROR MESSAGES */
/******************/

export const ERR_INVALID_AMOUNT = 'Allowance must be greater than zero'
export const ERR_INVALID_ACCOUNT = 'Account not found in registry'
export const ERR_INVALID_ESCROW_ACCOUNT = 'Escrow account not found in registry'
export const ERR_INSUFFICIENT_BALANCE = 'Account does not have enough balance for this transaction'
export const ERR_INSUFFICIENT_ESCROW_BALANCE = 'Escrow account does not have enough allowance for this transaction'
export const ERR_TOKEN_ALREADY_MINTED = 'Token has previously been minted'

export function _onlyContractOwner(): void {
    assert(CONTRACT_OWNER == context.predecessor, "only the contractowner can call this function");
}

export function _onlyTestNet(): void {
    assert(is_testnet_env(), "only callable on testnet");
}

export function _onlyPxDapps(): void {
    assert(PX_DAPPS_ACCOUNTS.includes(context.predecessor), "Account not allowed to call this method");
}