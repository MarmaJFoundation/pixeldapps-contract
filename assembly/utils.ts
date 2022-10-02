import { context, ContractPromiseBatch, RNG, u128 } from 'near-sdk-as'

export type AccountId = string;
export type CharacterId = string;
export type RaidId = string;
export type TokenId = string;
export type AllowanceKey = string; // format is Owner<AccountId>:Escrow<AccountId>
export type Amount = u128;

export const ONE_MILLI_SECOND: u64 = 1000;
export const ONE_MICRO_SECOND: u64 = ONE_MILLI_SECOND * 1000;
export const ONE_NANO_SECOND: u64 = ONE_MICRO_SECOND * 1000;
export const ONE_MINUTE_IN_NS: u64 = ONE_NANO_SECOND * 60;
export const ONE_HOUR_IN_NS: u64 = ONE_MINUTE_IN_NS * 60;
export const ONE_DAY_IN_NS: u64 = ONE_HOUR_IN_NS * 24;
export const ONE_WEEK_IN_NS: u64 = ONE_DAY_IN_NS * 7;
export const ONE_MONTH_IN_NS: u64 = ONE_DAY_IN_NS * 30;
export const ONE_YEAR_IN_NS: u64 = ONE_DAY_IN_NS * 365;
export const nanoToMinuteFactor: u64 = 60000000000;

export const XCC_GAS_ON_SELF_USE: u64 = 30_000_000_000_000;
export const XCC_GAS_RESOLVE: u64 = 35_000_000_000_000;
export const CONTRACT_OWNER: string = context.contractName;
export const TESTNET_ACCOUNT: string = "pixeltoken.testnet";

export const PX_DAPPS_ACCOUNTS: string[] = [
    context.contractName,
    "pixeltoken.sputnik-dao.near",
    "pxt-manager.near",
    "ctt-manager.near",
];

export const PX_DAPPS_TESTNET_DEV_ACCOUNTS: string[] = [
    "messages.testnet",
    "edzo.testnet",
];

export function is_testnet_env(): bool { return CONTRACT_OWNER == TESTNET_ACCOUNT; }
export function is_testnet_dev(): bool { return PX_DAPPS_TESTNET_DEV_ACCOUNTS.includes(context.predecessor); }

export const MANAGER_ACCOUNT: string = "pxt-manager.near";
export const BANK_ACCOUNT: string = "pxt-bank.near";
export const CUSTODY_ACCOUNT: string = "pxt-custody.near";

export const TOTAL_SUPPLY: u128 = u128.from("12500000000000");

export const ONE_TOKEN: u128 = u128.from("1000000");
export const ONE_NEAR: u128 = u128.from("1000000000000000000000000");
export const NEAR_150: u128 = u128.from("1500000000000000000000000");
export const NEAR_200: u128 = u128.from("2000000000000000000000000");

export const PIECE10000_TOKEN: u128 = u128.from("100");
export const PIECE10000_NEAR: u128 = u128.from("100000000000000000000");

export function asNEAR(amount: u128): u32 {
    return u128.div(amount, ONE_NEAR).as<u32>();
}

export function asNEAR2(amount: u128): f64 {
    return Math.round(u128.div(amount, PIECE10000_NEAR).as<f64>()) / 10000.0;
}

export function asPIXT(amount: u128): f32 {
    return u128.div(amount, PIECE10000_TOKEN).as<f32>() / 10000.0;
}

export function toYoctoNear(amount: string): u128 {
    return u128.mul(ONE_NEAR, u128.from(amount))
}

export function toYoctoToken(amount: string): u128 {
    return u128.mul(ONE_TOKEN, u128.from(amount));
}

export function randomNumber(min: u32, max: u32): u32 {
    return new RNG<u32>(1, (max - min) + 1).next() + min;
}

export function sendNear(recipient: string, amount: u128): void {
    ContractPromiseBatch.create(recipient).transfer(amount);
}