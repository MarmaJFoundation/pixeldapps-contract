import { storage, context } from "near-sdk-as";
import { eggRegistry } from "./helper/storage_manager";
import { ft_balance_of_impl, ft_transfer_internal_impl } from "../nep/141";
import { BANK_ACCOUNT } from "../utils";
import { RarityType } from "./helper/pp_types";
import { empty_PxBalance, PxBalanceWithToken } from "./helper/utils";

export function custom_balance_of_impl(account_id: string): PxBalanceWithToken {

  const balance = eggRegistry.get(account_id, empty_PxBalance)!;
  const returnBalance = new PxBalanceWithToken(ft_balance_of_impl(account_id), balance.egg_common, balance.egg_rare, balance.egg_epic, balance.egg_legendary);
  return returnBalance;
}

export function buy_egg_impl(egg_type: string): void {
  const availSupply = storage.getPrimitive<u32>(egg_type, 0);
  assert(["common", "rare", "epic", "legendary"].includes(egg_type), "EggType unknown");
  if (egg_type == "common") {
    assert(availSupply > 0, "Rare eggs are currently not on stock");
    const egg_price = storage.getPrimitive<string>("common_price", "30000000");
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, egg_price, null)
    add_egg(context.predecessor, 0);
    storage.set<u32>(egg_type, availSupply - 1);
  }
  else if (egg_type == "rare") {
    assert(availSupply > 0, "Rare eggs are currently not on stock");
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, "300000000", null)
    add_egg(context.predecessor, 1);
    storage.set<u32>(egg_type, availSupply - 1);
  }
  else if (egg_type == "epic") {
    assert(availSupply > 0, "Rare eggs are currently not on stock");
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, "2100000000", null)
    add_egg(context.predecessor, 2);
    storage.set<u32>(egg_type, availSupply - 1);
  }
  else if (egg_type == "legendary") {
    assert(availSupply > 0, "Legendary eggs are currently not on stock");
    ft_transfer_internal_impl(context.predecessor, BANK_ACCOUNT, "12000000000", null)
    add_egg(context.predecessor, 3);
    storage.set<u32>(egg_type, availSupply - 1);
  }
}

export function set_white_egg_price_impl(new_price: string): void {
  // TODO: assert if new_price is invalid?
  const egg_price = storage.getPrimitive<string>("common_price", "30000000");
  if (egg_price != new_price) {
    storage.set<string>("common_price", new_price);
  }
}

export function add_egg(account_id: string, rarity: RarityType): void {
  const balance = eggRegistry.get(account_id, empty_PxBalance)!;

  switch (rarity) {
    case 1:
      balance.egg_rare = balance.egg_rare + 1;
      break;
    case 2:
      balance.egg_epic = balance.egg_epic + 1;
      break;
    case 3:
      balance.egg_legendary = balance.egg_legendary + 1;
      break;
    default:
      balance.egg_common = balance.egg_common + 1;
      break;
  }

  eggRegistry.set(account_id, balance);
}

export function remove_egg(account_id: string, rarity: RarityType): void {
  const balance = eggRegistry.get(account_id, empty_PxBalance)!;

  switch (rarity) {
    case 1:
      assert(balance.egg_rare > 0, "No eggs available to transfer");
      balance.egg_rare = balance.egg_rare - 1;
      break;
    case 2:
      assert(balance.egg_epic > 0, "No eggs available to transfer");
      balance.egg_epic = balance.egg_epic - 1;
      break;
    case 3:
      assert(balance.egg_legendary > 0, "No eggs available to transfer");
      balance.egg_legendary = balance.egg_legendary - 1;
      break;
    default:
      assert(balance.egg_common > 0, "No eggs available to transfer");
      balance.egg_common = balance.egg_common - 1;
      break;
  }

  eggRegistry.set(account_id, balance);
}