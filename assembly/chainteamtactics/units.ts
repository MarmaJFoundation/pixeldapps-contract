import { _onlyPxDapps } from "../asserts";
import { CttUnitBaseData, CttUnitType } from "./helper/ctt_types";
import { cttUnitBaseRegistry } from "./helper/storage_manager";


export function ctt_insert_update_unit_impl(unitdata: CttUnitBaseData): void {
    _onlyPxDapps();
    cttUnitBaseRegistry.set(unitdata.unit_type, unitdata);
}

export function ctt_get_unit_base_impl(unit_type: CttUnitType): CttUnitBaseData {
    _onlyPxDapps();
    assert(cttUnitBaseRegistry.contains(unit_type), "Invalid unit type");
    return cttUnitBaseRegistry.getSome(unit_type);
}

// export function ctt_fire_unit_impl(token_id: TokenId): void {
//     ctt_delete_unit_impl(token_id);
// }