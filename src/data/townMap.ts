import { TileMap, TileDef } from "../model/TileMap";
import { Entity } from "../model/GameState";

/**
 * Town map — 24 cols × 28 rows.
 * Rows 0-8: narrow cave path (single-tile tunnel at col 10).
 * Rows 9-27: town proper.
 *
 * Layout highlights:
 *   Main road N-S at col 10.
 *   Cross road E-W at row 17 with fountain at col 10.
 *   Shops east side (cols 20-23): Blacksmith rows 10-17, Merchant rows 19-25.
 *   Path spine at col 19 rows 11-21 connects cross road to both shop doors.
 *   NW house rows 12-15, SW house rows 20-23.
 *   Water pond cols 13-16 rows 12-14.
 *   Trees/bushes scattered for town character.
 *
 * Tile legend:
 *   0 = grass   1 = wall   2 = path   3 = floor/door   4 = cave entrance
 *   5 = water   6 = tree   7 = bush   8 = fountain
 */
const tileDefs = new Map<number, TileDef>([
  [0, { sprite: "grass",      solid: false, label: "grass"    }],
  [1, { sprite: "stone_wall", solid: true,  label: "wall"     }],
  [2, { sprite: "stone2",     solid: false, label: "path"     }],
  [3, { sprite: "stone",      solid: false, label: "door"     }],
  [4, { sprite: "dun_floor",  solid: false, label: "cave entrance" }],
  [5, { sprite: "water",      solid: true,  label: "water"    }],
  [6, { sprite: "tree",       solid: true,  label: "tree"     }],
  [7, { sprite: "bush",       solid: false, label: "bush"     }],
  [8, { sprite: "fountain",   solid: true,  label: "fountain" }],
]);

const _ = 0, WL = 1, P = 2, D = 3, C = 4, WA = 5, TR = 6, BS = 7, FO = 8;

const grid: number[][] = [
  // 0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23
  // ── Rows 0-7: narrow cave tunnel ──
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  C, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 0
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 1
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 2
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 3
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 4
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 5
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 6
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 7
  // ── Row 8: old north wall, opened at col 10 ──
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL,  P, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 8
  // ── Town proper ──
  [WL, TR, TR, TR, TR, TR, TR,  _,  _,  _,  P,  _, TR, TR, TR, TR, TR, TR, TR, TR,  _,  _,  _, WL], // 9  trees N
  [WL,  _, TR,  _,  _, TR,  _,  _,  _,  _,  P,  _,  _,  _, TR,  _,  _, TR,  _,  _, WL, WL, WL, WL], // 10 BS N wall
  [WL,  _,  _,  _,  _,  _,  _,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  P,  D,  _,  _, WL], // 11 BS door(20,11)
  [WL,  _, WL, WL,  D, WL, WL,  _,  _,  _,  P,  _,  _, WA, WA, WA, WA,  _,  _,  P, WL,  _,  _, WL], // 12 NW house, pond
  [WL,  _, WL,  _,  _,  _, WL,  _,  _,  _,  P,  _,  _, WA, WA, WA, WA,  _,  _,  P, WL,  _,  _, WL], // 13
  [WL,  _, WL,  _,  _,  _, WL,  _,  _,  _,  P,  _,  _, WA, WA, WA, WA,  _,  _,  P, WL,  _,  _, WL], // 14
  [WL,  _, WL, WL, WL, WL, WL,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  P, WL,  _,  _, WL], // 15 NW house end
  [WL,  _,  _,  _,  _,  _,  _,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _, BS,  _,  P, WL,  _,  _, WL], // 16
  [WL,  P,  P,  P,  P,  P,  P,  P,  P,  P, FO,  P,  P,  P,  P,  P,  P,  P,  P,  P, WL, WL, WL, WL], // 17 cross road + BS S wall
  [WL,  _,  _,  _,  _,  _,  _, BS,  _,  _,  P,  _,  _,  _,  _,  _,  _, BS,  _,  P,  _,  _,  _, WL], // 18 bushes
  [WL,  _,  _,  _,  _,  _,  _,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  P, WL, WL, WL, WL], // 19 Merch N wall
  [WL,  _, WL, WL,  D, WL, WL,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  P, WL,  _,  _, WL], // 20 SW house
  [WL,  _, WL,  _,  _,  _, WL,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  P,  D,  _,  _, WL], // 21 Merch door(20,21)
  [WL,  _, WL,  _,  _,  _, WL,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  _, WL,  _,  _, WL], // 22
  [WL,  _, WL, WL, WL, WL, WL,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  _, WL,  _,  _, WL], // 23 SW house end
  [WL,  _,  _,  _,  _,  _,  _,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  _, WL,  _,  _, WL], // 24
  [WL,  _,  _,  _,  _,  _,  _,  _,  _,  _,  P,  _,  _,  _,  _,  _,  _,  _,  _,  _, WL, WL, WL, WL], // 25 Merch S wall
  [WL, BS, BS,  _,  _,  _, BS, BS,  _,  _,  P,  _, BS, BS,  _,  _,  _, BS, BS,  _,  _,  _,  _, WL], // 26 bush border
  [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // 27
];

export const townMap = new TileMap(grid, tileDefs);

export const townEntities: Entity[] = [
  // Cave entrance portal
  {
    x: 10, y: 0, type: "portal", sprite: "cave_entrance",
    name: "Cave Entrance",
    behavior: { targetMap: "dungeon_1", targetX: 3, targetY: 3 },
  },

  // Elder Gareth at the cross road fountain (west side)
  {
    x: 9, y: 17, type: "npc", sprite: "villager",
    name: "Elder Gareth",
    behavior: {
      tips: [
        "Equip a weapon before entering the cave — fists barely scratch a scorpion.",
        "The Blacksmith east of here sells Iron and Steel swords. Follow the main road.",
        "Armor reduces enemy damage. A shield stacks on top of body armor.",
        "Buy Healing Potions from the Merchant. Drink them in inventory (I key).",
        "Strength Scrolls raise your stats permanently — worth every coin.",
        "Enemies chase you once they spot you. Use doorways to funnel them.",
        "The lower cave holds a Cyclops and a Demon. Don't go unprepared.",
        "Gold dropped by enemies can fund better gear from the shops.",
        "Press M to view the map — only explored tiles are shown in caves.",
        "Strength raises your attack. Constitution raises your max HP.",
        "Rest from the Menu (Esc) to recover HP and MP — only safe in town.",
        "Search the supply crates around town for useful items.",
      ],
    },
  },

  // Healing Potion inside NW house
  {
    x: 4, y: 13, type: "item", sprite: "potion",
    name: "Healing Potion", healAmt: 8, price: 20,
  },

  // Supply crate near cross road (west side)
  {
    x: 7, y: 16, type: "chest", sprite: "crate",
    name: "Supply Crate",
    loot: [
      { x: 0, y: 0, type: "item", sprite: "potion", name: "Healing Potion", healAmt: 8, price: 20 },
    ],
  },

  // Supply crate east of pond
  {
    x: 17, y: 13, type: "chest", sprite: "crate",
    name: "Old Crate",
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Coins", gold: 30 },
    ],
  },

  // Healing Potion inside SW house
  {
    x: 4, y: 21, type: "item", sprite: "potion",
    name: "Healing Potion", healAmt: 8, price: 20,
  },

  // Dusty crate south area
  {
    x: 8, y: 24, type: "chest", sprite: "crate",
    name: "Dusty Crate",
    loot: [
      { x: 0, y: 0, type: "item", sprite: "ancient_map", name: "Wisdom Scroll", boostStat: "int", boostAmt: 1, price: 40 },
    ],
  },

  // ── Blacksmith NPC ──
  {
    x: 21, y: 13, type: "npc", sprite: "guard",
    name: "Blacksmith Hrolf",
    behavior: { shopId: "blacksmith", dialogue: "Finest steel in the region." },
  },

  // ── Merchant NPC ──
  {
    x: 21, y: 22, type: "npc", sprite: "villager",
    name: "Merchant Lyra",
    behavior: { shopId: "merchant", dialogue: "Potions, scrolls, and rare curiosities." },
  },
];
