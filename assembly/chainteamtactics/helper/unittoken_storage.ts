import { logging, u128 } from "near-sdk-as";
import { AccountId, is_testnet_env, TokenId } from "../../utils";
import { TokenMetadata } from "./ctt_nep";
import { CttUnitToken, CttUnitType } from "./ctt_types";
import { cttMarketplaceRegistry, cttPlayerRegistry, cttUnitTokenRegistry } from "./storage_manager";
import { CTT_MAX_UNITS_COUNT } from "./utils";

export function ctt_get_units_by_ids_impl(token_ids: TokenId[], start: u32 = 0, limit: u32 = token_ids.length): CttUnitToken[] {



    if(u32(start + limit) < u32(token_ids.length)) {
        limit = start + limit;
    }
    else {
        limit = token_ids.length;
    }

    let token_amount = limit - start;

    const unit_tokens: CttUnitToken[] = new Array<CttUnitToken>(token_amount);

    let j = 0;
    for (let i: u32 = start; i < limit; i++) {
        const token = cttUnitTokenRegistry.getSome(token_ids[i]);
        token.metadata = new TokenMetadata("#" + token.token_id + " - " + get_unittype(token.unit_type) + " | Power: " + get_avg_power_modifier(token).toString(), "https://ecosystem.pixeldapps.co/ctt/units/" + token.token_id.toString() + ".png", null);
        token.owner_id = token.owner;
        token.metadata.reference = null;
        unit_tokens[j] = token;
        j++;
    }
    return unit_tokens;
}

//remove export later
export function get_avg_power_modifier(token: CttUnitToken): u32 {
    return u32((token.damage_mod + token.health_mod + token.speed_mod) / 3);
}

export function get_unittype(type: CttUnitType): string {

    if (type == CttUnitType.None) {
        return "None";
    }
    if (type == CttUnitType.Squire) {
        return "Squire";
    }
    if (type == CttUnitType.Knight) {
        return "Knight";
    }
    if (type == CttUnitType.Mage) {
        return "Mage";
    }
    if (type == CttUnitType.Chemist) {
        return "Chemist";
    }
    if (type == CttUnitType.Executioner) {
        return "Executioner";
    }
    if (type == CttUnitType.Marksman) {
        return "Marksman";
    }
    if (type == CttUnitType.Priest) {
        return "Priest";
    }
    if (type == CttUnitType.Warlock) {
        return "Warlock";
    }
    if (type == CttUnitType.Druid) {
        return "Druid";
    }
    if (type == CttUnitType.Bard) {
        return "Bard";
    }
    if (type == CttUnitType.Assassin) {
        return "Assassin";
    }
    if (type == CttUnitType.Elementalist) {
        return "Elementalist";
    }
    if (type == CttUnitType.Necromancer) {
        return "Necromancer";
    }
    if (type == CttUnitType.Paladin) {
        return "Paladin";
    }
    if (type == CttUnitType.TimeBender) {
        return "TimeBender";
    }
    if (type == CttUnitType.Skeleton) {
        return "Skeleton";
    }
    if (type == CttUnitType.Wolf) {
        return "Wolf";
    }

    return "Unknown";
}

export function ctt_add_unit_to_player_intern(account_id: AccountId, token_id: TokenId): CttUnitToken {
    const player_data = cttPlayerRegistry.getSome(account_id);
    const unit_token = cttUnitTokenRegistry.getSome(token_id);

    player_data.unit_ids.push(unit_token.token_id);
    cttPlayerRegistry.set(account_id, player_data);

    unit_token.owner = account_id;
    unit_token.price = u128.Zero;
    cttUnitTokenRegistry.set(unit_token.token_id, unit_token);
    cttMarketplaceRegistry.set(token_id, u128.Zero);

    if (is_testnet_env()) {
        logging.log(`added unit #${token_id} to @${account_id}`);
    }

    return unit_token;
}

function ctt_remove_unit_from_player_intern(account_id: AccountId, token_id: TokenId): void {
    const player_data = cttPlayerRegistry.getSome(account_id);
    const index = player_data.unit_ids.indexOf(token_id);

    assert(index != -1, "You don't own this unit");

    player_data.unit_ids.splice(index, 1);
    cttPlayerRegistry.set(account_id, player_data);

    if (is_testnet_env()) {
        logging.log(`removed unit #${token_id} from @${account_id}`);
    }
}

export function ctt_transfer_unit(sender_id: AccountId, receiver_id: AccountId, token_id: TokenId): void {
    ctt_remove_unit_from_player_intern(sender_id, token_id);
    ctt_add_unit_to_player_intern(receiver_id, token_id);

    if (is_testnet_env()) {
        logging.log(`transferred unit #${token_id} from @${sender_id} to @${receiver_id}`);
    }
}

export function ctt_ensure_units_threshold(account_id: AccountId, unit_count: u32 = 1): void {
    assert(unit_count > 0, "Unit count should be higher than zero");
    const player_data = cttPlayerRegistry.getSome(account_id);
    assert(player_data.unit_ids.length + (unit_count - 1) < CTT_MAX_UNITS_COUNT, `You can only own ${CTT_MAX_UNITS_COUNT} units at the same time`);
}