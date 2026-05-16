import { TileMap, TileDef } from "../model/TileMap";
import { Entity } from "../model/GameState";

/**
 * Cave dungeon — fog of war enabled. Tiles dark until seen.
 *
 * Layout (28 cols × 20 rows):
 *   Room A (NW): cols 1-10, rows 1-7
 *   Room B (NE): cols 12-26, rows 1-7
 *   Hallway A↔B: col 11 open at rows 4 and 6
 *   Central hall: cols 1-26, rows 9-14
 *   Connections A/B→hall: col 1 at row 8, col 26 at row 8
 *   Lower room: cols 1-26, rows 16-18
 *   Corridors hall→lower: col 6 and col 19 at row 15
 *
 * Tile legend:
 *   0 = dungeon floor (passable)
 *   1 = dungeon wall (solid, opaque)
 *   2 = pillar (solid, opaque)
 *   3 = dark void (solid, opaque)
 */
const tileDefs = new Map<number, TileDef>([
  [0, { sprite: "dun_floor",  solid: false, label: "floor" }],
  [1, { sprite: "dun_wall",   solid: true,  label: "rock wall" }],
  [2, { sprite: "dun_pillar", solid: true,  label: "pillar" }],
  [3, { sprite: "dun_dark",   solid: true,  label: "rock" }],
]);

const _ = 0;
const W = 1;
const P = 2;

// 28 cols × 20 rows
const grid: number[][] = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, _, _, _, _, _, _, _, _, _, _, W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, P, P, _, _, _, _, _, _, W, _, _, _, _, P, P, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W], // hall: col 11 open
  [W, _, _, P, P, _, _, _, _, _, _, W, _, _, _, _, P, P, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W], // hall: col 11 open
  [W, _, _, _, _, _, _, _, _, _, _, W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, _, W], // corridor openings at col 1 + col 26
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, P, _, _, _, _, _, P, _, _, _, _, _, P, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, P, _, _, _, _, _, P, _, _, _, _, _, P, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, W, W, W, W, W, _, W, W, W, W, W, W, W, W, W, W, W, W, _, W, W, W, W, W, W, W, W], // corridors at col 6 + col 19
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, P, _, _, _, _, _, _, _, _, _, _, _, _, _, _, P, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
];

export const caveMap = new TileMap(grid, tileDefs, /* fogOfWar */ true);

export const caveEntities: Entity[] = [
  // Portal back to town
  {
    x: 1, y: 1,
    type: "portal",
    sprite: "cave_entrance",
    name: "Exit to Town",
    behavior: { targetMap: "town", targetX: 15, targetY: 23 },
  },
  // Rusted Sword — just inside entrance for new players
  {
    x: 3, y: 2,
    type: "item",
    sprite: "rusty_sword",
    name: "Rusted Sword",
    slot: "weapon",
    atk: 3,
    price: 15,
  },

  // Room A (NW) — orc with loot
  {
    x: 6, y: 4,
    type: "enemy",
    sprite: "orc",
    name: "Orc",
    hp: 8, maxHp: 8, atk: 2,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Pile", gold: 15 },
      { x: 0, y: 0, type: "item", sprite: "dagger", name: "Steel Dagger", slot: "weapon", atk: 4 },
    ],
  },
  {
    x: 8, y: 2,
    type: "treasure",
    sprite: "gold",
    name: "Gold Pile",
    gold: 10,
  },

  // Room B (NE) — skeleton with loot
  {
    x: 20, y: 4,
    type: "enemy",
    sprite: "skeleton",
    name: "Skeleton",
    hp: 6, maxHp: 6, atk: 2,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Pile", gold: 20 },
    ],
  },
  {
    x: 24, y: 6,
    type: "item",
    sprite: "potion",
    name: "Healing Potion",
    healAmt: 8,
  },

  // Central hall — two scorpions
  {
    x: 9, y: 11,
    type: "enemy",
    sprite: "scorpion",
    name: "Scorpion",
    hp: 5, maxHp: 5, atk: 1,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Pile", gold: 8 },
    ],
  },
  {
    x: 20, y: 12,
    type: "enemy",
    sprite: "scorpion",
    name: "Scorpion",
    hp: 5, maxHp: 5, atk: 1,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Pile", gold: 8 },
    ],
  },
  {
    x: 14, y: 10,
    type: "treasure",
    sprite: "gold",
    name: "Gold Pile",
    gold: 12,
  },

  // Lower room — cyclops (left) + demon boss (right)
  {
    x: 7, y: 17,
    type: "enemy",
    sprite: "cyclops",
    name: "Cyclops",
    hp: 12, maxHp: 12, atk: 3,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Hoard", gold: 40 },
    ],
  },
  {
    x: 22, y: 17,
    type: "enemy",
    sprite: "demon",
    name: "Demon",
    hp: 18, maxHp: 18, atk: 4,
    loot: [
      { x: 0, y: 0, type: "treasure", sprite: "gold", name: "Gold Hoard", gold: 75 },
      { x: 0, y: 0, type: "item", sprite: "potion", name: "Healing Potion" },
    ],
  },
  {
    x: 25, y: 18,
    type: "treasure",
    sprite: "gold",
    name: "Gold Pile",
    gold: 25,
  },
];
