import { EquipSlot } from "../model/GameState";

export interface ShopItem {
  name: string;
  sprite: string;
  price: number;
  slot?: EquipSlot;
  atk?: number;
  def?: number;
  healAmt?: number;
  boostStat?: "str" | "int" | "con" | "dex";
  boostAmt?: number;
}

export const BLACKSMITH_STOCK: ShopItem[] = [
  { name: "Iron Sword",    sprite: "rusty_sword", slot: "weapon", atk: 5,  price: 50  },
  { name: "Steel Sword",   sprite: "rusty_sword", slot: "weapon", atk: 8,  price: 170 },
  { name: "Leather Armor", sprite: "guard",       slot: "armor",  def: 2,  price: 40  },
  { name: "Chain Mail",    sprite: "guard",       slot: "armor",  def: 4,  price: 90  },
  { name: "Iron Shield",   sprite: "locked_chest",slot: "shield", def: 2,  price: 45  },
  { name: "Iron Helm",     sprite: "guard",       slot: "head",   def: 1,  price: 30  },
];

export const MERCHANT_STOCK: ShopItem[] = [
  { name: "Healing Potion",  sprite: "potion",       healAmt: 8,  price: 20  },
  { name: "Greater Potion",  sprite: "potion",       healAmt: 16, price: 40  },
  { name: "Leather Satchel", sprite: "locked_chest",              price: 30  },
  { name: "Strength Scroll", sprite: "ancient_map",  boostStat: "str", boostAmt: 2, price: 80 },
  { name: "Wisdom Scroll",   sprite: "ancient_map",  boostStat: "int", boostAmt: 2, price: 80 },
  { name: "Con Elixir",      sprite: "ancient_map",  boostStat: "con", boostAmt: 2, price: 80 },
  { name: "Ruby Gem",        sprite: "potion",                        price: 150 },
];

export const SHOPS: Record<string, ShopItem[]> = {
  blacksmith: BLACKSMITH_STOCK,
  merchant:   MERCHANT_STOCK,
};
