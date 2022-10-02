import { PersistentMap, storage } from "near-sdk-as";
import { _onlyContractOwner, _onlyPxDapps } from "../asserts";

export const reward_history = new PersistentMap<string, string>("h");

@nearBindgen
export class EggSupply {

    public common: u32;
    public common_price: string;
    public rare: u32;
    public rare_price: string;
    public epic: u32;
    public epic_price: string;
    public legendary: u32;
    public legendary_price: string;
}

export function get_egg_supply_impl(): EggSupply {

    return {
        common: storage.getPrimitive<u32>("common", 0),
        common_price: storage.getPrimitive<string>("common_price", "30000000"),
        rare: storage.getPrimitive<u32>("rare", 0),
        rare_price: "300000000",
        epic: storage.getPrimitive<u32>("epic", 0),
        epic_price: "2100000000",
        legendary: storage.getPrimitive<u32>("legendary", 0),
        legendary_price: "12000000000"
    };
}

export function set_egg_supply_impl(egg_type: string, supply: u32): void {
    assert(["common", "rare", "epic", "legendary"].includes(egg_type), "EggType unknown");
    storage.set<u32>(egg_type, supply);
}