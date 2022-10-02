import { context, u128 } from "near-sdk-as";
import { CttUnitToken } from "./ctt_types";
import { cttPlayerRegistry, cttUnitTokenRegistry } from "./storage_manager";
import { ctt_get_units_by_ids_impl, ctt_transfer_unit } from "./unittoken_storage";

export function nft_total_supply(): string {
    return cttUnitTokenRegistry.length.toString();
}

export function nft_metadata_impl(): NFTContractMetadata {
    const md = new NFTContractMetadata(
        "nft-1.0.0",
        "Chain Team Tactics",
        "CTT",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAJ9JREFUWIXtlrsNgDAMRB1ExQZQMAljMUbmzAhpoUoRI+QjfI7C1yFZ4u7JPgjjvGxCVMd8uRsQEenRwRRz9TytwyMG6ATcwOcGUszVPtEJwFdwVyW1vp7/ErDuHu2Fs+RF/yWgpROj81Zj0gkE/T+gnVvJ9dzVbwSdgLkDaKJWEnQChx3QQnegVXQCcA9YTdgqOgE34AbcgNmEb4tOYAft3jJ5k/dGtQAAAABJRU5ErkJggg==",
        "https://ecosystem.pixeldapps.co/ctt"

    );
    return md;

}

export function nft_tokens(
    from_index: string, // default: "0"
    limit: u32, // default: unlimited (could fail due to gas limit)
): CttUnitToken[] {
    return cttUnitTokenRegistry.values(u32(from_index), u32(from_index) + limit);
}

export function nft_supply_for_owner_impl(account_id: string): string {

    const player_data = cttPlayerRegistry.get(account_id);
    if (player_data) {
        return player_data.unit_ids.length.toString();
    }
    else {
        return "0";
    }
}

//this function will error with gaslimit exceeded it limit is too high, this is part of the specification
export function nft_tokens_for_owner_impl(account_id: string, from_index: string = "0", limit: u32 = 20): CttUnitToken[] {
    const player_data = cttPlayerRegistry.getSome(account_id);
    return ctt_get_units_by_ids_impl(player_data.unit_ids, u32(parseInt(from_index)), limit);
}

export function nft_transfer_impl(sender_id: string ,receiver_id: string, token_id: string): void {
    const unit_token = cttUnitTokenRegistry.getSome(token_id);
    assert(unit_token.owner == sender_id, "You don't own this unit");
    assert(unit_token.price == u128.Zero, "You can't transfer a token that is on sale");
    ctt_transfer_unit(sender_id, receiver_id, token_id);
}


@nearBindgen
export class NFTContractMetadata {

    constructor(
        public spec: string, // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
        public name: string, // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
        public symbol: string, // required, ex. "MOCHI"
        public icon: string, // Data URL
        public base_uri: string // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    ) { }
}

@nearBindgen
export class TokenMetadata {

    constructor(
        public title: string, // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
        public media: string, // URL to associated media, preferably to decentralized, content-addressed storage
        public reference: string | null = null, // URL to an off-chain JSON file with more info.
        public media_hash: string | null = null,
        public copies: string | null = null,
        public expires_at: string | null = null,
        public starts_at: string | null = null,
        public updated_at: string | null = null,
        public extra: string | null = null,
        public reference_hash: string | null = null,
    ) { }
}
