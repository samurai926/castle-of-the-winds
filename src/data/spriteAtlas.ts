import { SpriteDef } from "../view/SpriteSheet";

/**
 * Procedurally generated sprite atlas matching Castle of the Winds aesthetic:
 * Black/dark line-art on white backgrounds, Windows 3.1 icon style.
 *
 * Atlas layout (32×32 tiles, 8 columns × 4 rows):
 *   Row 0: terrain — grass, wall, path, door, cave_entrance
 *   Row 1: entities — villager, rusty_sword, portal, locked_chest, guard
 *   Row 2: player, orc, scorpion, skeleton
 *   Row 3: dungeon tiles — dun_floor, dun_wall, dun_dark, dun_pillar
 */

const T = 32;

function tileAt(col: number, row: number): SpriteDef {
  return { sx: col * T, sy: row * T, sw: T, sh: T };
}

export const SPRITE_DEFS: Record<string, SpriteDef> = {
  // Row 0: terrain
  grass:          tileAt(0, 0),
  stone_wall:     tileAt(1, 0),
  stone2:         tileAt(2, 0),
  stone:          tileAt(3, 0),
  cave_entrance:  tileAt(4, 0),
  house:          tileAt(5, 0),
  gate:           tileAt(6, 0),
  dun_floor:      tileAt(7, 0),

  // Row 1: entities & items
  villager:       tileAt(0, 1),
  rusty_sword:    tileAt(1, 1),
  portal:         tileAt(2, 1),
  locked_chest:   tileAt(3, 1),
  guard:          tileAt(4, 1),
  dagger:         tileAt(5, 1),
  potion:         tileAt(6, 1),
  magic_gem:      tileAt(7, 1),

  // Aliases — reuse existing tiles for new entities
  iron_key:       tileAt(7, 1), // reuse magic_gem art (yellow gem-ish)
  locked_door:    tileAt(6, 0), // reuse gate art (iron gate)

  // Row 2: player & monsters
  player:         tileAt(0, 2),
  orc:            tileAt(1, 2),
  scorpion:       tileAt(2, 2),
  skeleton:       tileAt(3, 2),
  demon:          tileAt(4, 2),
  sphinx:         tileAt(5, 2),
  npc_statue:     tileAt(6, 2),
  cyclops:        tileAt(7, 2),

  // Row 3: dungeon terrain
  dun_wall:       tileAt(0, 3),
  dun_dark:       tileAt(1, 3),
  dun_pillar:     tileAt(2, 3),
  brick_wall:     tileAt(3, 3),
  dark_floor:     tileAt(4, 3),
  dark_floor2:    tileAt(5, 3),
  pillar:         tileAt(6, 3),
  ancient_map:    tileAt(7, 3),
  gold:           tileAt(7, 3),

  // Row 4: town nature & objects
  water:          tileAt(0, 4),
  tree:           tileAt(1, 4),
  bush:           tileAt(2, 4),
  crate:          tileAt(3, 4),
  fountain:       tileAt(4, 4),
};

/**
 * Generate the atlas as a data URL.
 * Each sprite is drawn as chunky pixel art (4×4 real px per "pixel")
 * in the Castle of the Winds black-outline-on-white style.
 */
export function generateAtlas(castleImg?: HTMLImageElement): string {
  const cols = 8;
  const rows = 5;
  const c = document.createElement("canvas");
  c.width = cols * T;
  c.height = rows * T;
  const ctx = c.getContext("2d")!;
  // Start transparent — terrain sprites draw explicit backgrounds, entity sprites float.

  const P = 4; // pixel scale: each art pixel = 4×4 real pixels

  function dot(tCol: number, tRow: number, x: number, y: number, color = "#000000") {
    ctx.fillStyle = color;
    ctx.fillRect(tCol * T + x * P, tRow * T + y * P, P, P);
  }

  function rect(tCol: number, tRow: number, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(tCol * T + x * P, tRow * T + y * P, w * P, h * P);
  }

  // ============ ROW 0: TERRAIN ============

  // (0,0) Grass — white with green tufts
  for (const [gx, gy] of [[1,6],[2,5],[5,3],[6,5],[3,1],[4,6],[7,2]]) {
    dot(0, 0, gx, gy, "#408040");
  }
  for (const [gx, gy] of [[2,4],[5,2],[6,4],[3,0]]) {
    dot(0, 0, gx, gy, "#60a060");
  }

  // (1,0) Stone wall — gray block with mortar lines
  rect(1, 0, 0, 0, 8, 8, "#a0a0a0");
  // Mortar (dark lines)
  for (let i = 0; i < 8; i++) {
    dot(1, 0, i, 0, "#707070"); dot(1, 0, i, 4, "#707070");
    dot(1, 0, i, 7, "#707070");
  }
  for (let j = 0; j < 8; j++) {
    dot(1, 0, 0, j, "#707070"); dot(1, 0, 7, j, "#707070");
  }
  dot(1, 0, 4, 1, "#707070"); dot(1, 0, 4, 2, "#707070"); dot(1, 0, 4, 3, "#707070");
  dot(1, 0, 2, 5, "#707070"); dot(1, 0, 2, 6, "#707070");
  dot(1, 0, 5, 5, "#707070"); dot(1, 0, 5, 6, "#707070");
  // Highlights
  for (let i = 1; i < 4; i++) { dot(1, 0, i, 1, "#c0c0c0"); }
  for (let i = 5; i < 7; i++) { dot(1, 0, i, 1, "#c0c0c0"); }

  // (2,0) Stone path — tan cobblestone
  rect(2, 0, 0, 0, 8, 8, "#d0c098");
  for (const [sx, sy] of [[0,0],[3,0],[6,0],[1,3],[4,3],[7,3],[0,6],[3,6],[6,6]]) {
    dot(2, 0, sx, sy, "#b0a070");
    dot(2, 0, sx+1, sy, "#b0a070");
  }

  // (3,0) Door/interior floor — lighter stone
  rect(3, 0, 0, 0, 8, 8, "#e0d8c8");
  for (let i = 0; i < 8; i += 2) {
    dot(3, 0, i, 0, "#c8c0a8");
    dot(3, 0, i+1, 4, "#c8c0a8");
  }

  // (4,0) Cave entrance — dark arch on stone
  rect(4, 0, 0, 0, 8, 8, "#909090");
  // Arch
  for (let i = 2; i <= 5; i++) dot(4, 0, i, 1, "#404040");
  for (let j = 2; j < 8; j++) { dot(4, 0, 2, j, "#404040"); dot(4, 0, 5, j, "#404040"); }
  // Dark interior
  for (let j = 2; j < 8; j++) { for (let i = 3; i <= 4; i++) dot(4, 0, i, j, "#181818"); }
  // Keystone
  dot(4, 0, 3, 1, "#606060"); dot(4, 0, 4, 1, "#606060");

  // (5,0) House — small building
  rect(5, 0, 0, 0, 8, 8, "#60a060"); // grass base
  // Roof
  for (let i = 2; i <= 5; i++) dot(5, 0, i, 0, "#904020");
  for (let i = 1; i <= 6; i++) dot(5, 0, i, 1, "#904020");
  // Walls
  rect(5, 0, 1, 2, 6, 5, "#c0b080");
  // Door
  rect(5, 0, 3, 4, 2, 3, "#704020");
  // Window
  dot(5, 0, 2, 3, "#80c0e0"); dot(5, 0, 5, 3, "#80c0e0");
  // Outline
  for (let j = 2; j <= 6; j++) { dot(5, 0, 1, j, "#404040"); dot(5, 0, 6, j, "#404040"); }
  dot(5, 0, 1, 7, "#404040"); dot(5, 0, 6, 7, "#404040");

  // (6,0) Gate — iron gate
  rect(6, 0, 0, 0, 8, 8, "#c0c0c0");
  for (let j = 0; j < 8; j++) { dot(6, 0, 2, j, "#404040"); dot(6, 0, 5, j, "#404040"); }
  for (let i = 0; i < 8; i++) { dot(6, 0, i, 0, "#404040"); dot(6, 0, i, 3, "#404040"); }
  dot(6, 0, 3, 1, "#404040"); dot(6, 0, 4, 1, "#404040");
  dot(6, 0, 3, 2, "#404040"); dot(6, 0, 4, 2, "#404040");

  // (7,0) Dungeon floor — dark stone
  rect(7, 0, 0, 0, 8, 8, "#585858");
  for (const [sx, sy] of [[1,1],[4,1],[7,1],[2,4],[5,4],[0,7],[3,7],[6,7]]) {
    dot(7, 0, sx, sy, "#484848");
  }

  // ============ ROW 1: ENTITIES & ITEMS ============

  // (0,1) Villager/NPC — robed figure
  // Head
  dot(0, 1, 3, 0, "#d0a878"); dot(0, 1, 4, 0, "#d0a878");
  dot(0, 1, 3, 1, "#d0a878"); dot(0, 1, 4, 1, "#d0a878");
  // Eyes
  dot(0, 1, 3, 1, "#000000"); dot(0, 1, 4, 1, "#000000");
  // Hair
  dot(0, 1, 2, 0, "#808080"); dot(0, 1, 5, 0, "#808080");
  // Robe
  for (let j = 2; j <= 5; j++) {
    rect(0, 1, 2, j, 4, 1, "#000080");
  }
  // Robe flare
  rect(0, 1, 1, 6, 6, 1, "#000080");
  // Feet
  dot(0, 1, 2, 7, "#404040"); dot(0, 1, 5, 7, "#404040");
  // Staff
  for (let j = 0; j < 8; j++) dot(0, 1, 7, j, "#804000");
  dot(0, 1, 6, 0, "#c0c000"); dot(0, 1, 7, 0, "#c0c000"); // staff gem

  // (1,1) Rusty sword
  // Blade
  for (let j = 0; j < 5; j++) { dot(1, 1, 3, j, "#909090"); dot(1, 1, 4, j, "#b0b0b0"); }
  dot(1, 1, 3, 0, "#c0c0c0"); dot(1, 1, 4, 0, "#c0c0c0"); // tip highlight
  // Crossguard
  for (let i = 1; i <= 6; i++) dot(1, 1, i, 5, "#804020");
  // Grip
  dot(1, 1, 3, 6, "#603010"); dot(1, 1, 4, 6, "#603010");
  // Pommel
  dot(1, 1, 3, 7, "#c0a000"); dot(1, 1, 4, 7, "#c0a000");

  // (2,1) Portal — swirling blue vortex
  for (const [px2, py2] of [[3,0],[4,0],[2,1],[5,1],[1,2],[6,2],[1,3],[6,3],[1,4],[6,4],[1,5],[6,5],[2,6],[5,6],[3,7],[4,7]]) {
    dot(2, 1, px2, py2, "#4040c0");
  }
  dot(2, 1, 3, 3, "#6060e0"); dot(2, 1, 4, 3, "#6060e0");
  dot(2, 1, 4, 4, "#6060e0"); dot(2, 1, 3, 5, "#6060e0");
  dot(2, 1, 3, 4, "#8080ff"); dot(2, 1, 4, 5, "#8080ff");

  // (3,1) Locked chest
  // Body
  rect(3, 1, 1, 3, 6, 4, "#804020");
  // Lid
  rect(3, 1, 1, 2, 6, 1, "#905030");
  for (let i = 1; i <= 6; i++) dot(3, 1, i, 1, "#905030");
  // Lock
  dot(3, 1, 3, 4, "#c0c000"); dot(3, 1, 4, 4, "#c0c000");
  dot(3, 1, 3, 5, "#c0c000"); dot(3, 1, 4, 5, "#c0c000");
  // Metal bands
  for (let i = 1; i <= 6; i++) { dot(3, 1, i, 3, "#606060"); dot(3, 1, i, 6, "#606060"); }

  // (4,1) Guard — armored with spear
  dot(4, 1, 3, 0, "#808080"); dot(4, 1, 4, 0, "#808080"); // helmet
  dot(4, 1, 3, 1, "#d0a878"); dot(4, 1, 4, 1, "#d0a878"); // face
  dot(4, 1, 3, 1, "#000000"); dot(4, 1, 4, 1, "#000000"); // eyes
  for (let j = 2; j <= 4; j++) rect(4, 1, 2, j, 4, 1, "#808080"); // armor
  dot(4, 1, 1, 3, "#808080"); dot(4, 1, 6, 3, "#808080"); // arms
  rect(4, 1, 2, 5, 1, 2, "#606060"); rect(4, 1, 5, 5, 1, 2, "#606060"); // legs
  dot(4, 1, 2, 7, "#404040"); dot(4, 1, 5, 7, "#404040"); // boots
  for (let j = 0; j < 7; j++) dot(4, 1, 7, j, "#804000"); // spear shaft
  dot(4, 1, 7, 0, "#c0c0c0"); // spear tip

  // (5,1) Dagger
  for (let j = 0; j < 4; j++) dot(5, 1, 4, j, "#b0b0b0");
  for (let i = 3; i <= 5; i++) dot(5, 1, i, 4, "#804020");
  dot(5, 1, 4, 5, "#603010"); dot(5, 1, 4, 6, "#c0a000");

  // (6,1) Potion — red bottle
  dot(6, 1, 3, 1, "#808080"); dot(6, 1, 4, 1, "#808080"); // cork
  dot(6, 1, 3, 2, "#c0c0c0"); dot(6, 1, 4, 2, "#c0c0c0"); // neck
  for (let j = 3; j <= 6; j++) rect(6, 1, 2, j, 4, 1, "#c02020"); // body
  rect(6, 1, 2, 7, 4, 1, "#c02020");
  dot(6, 1, 3, 4, "#ff4040"); // highlight

  // (7,1) Magic gem — blue diamond
  dot(7, 1, 3, 1, "#4040c0"); dot(7, 1, 4, 1, "#4040c0");
  dot(7, 1, 2, 2, "#4040c0"); dot(7, 1, 5, 2, "#4040c0");
  dot(7, 1, 3, 2, "#6060e0"); dot(7, 1, 4, 2, "#6060e0");
  dot(7, 1, 1, 3, "#4040c0"); dot(7, 1, 6, 3, "#4040c0");
  dot(7, 1, 2, 3, "#6060e0"); dot(7, 1, 5, 3, "#6060e0");
  dot(7, 1, 3, 3, "#8080ff"); dot(7, 1, 4, 3, "#8080ff");
  dot(7, 1, 2, 4, "#4040c0"); dot(7, 1, 5, 4, "#4040c0");
  dot(7, 1, 3, 4, "#6060e0"); dot(7, 1, 4, 4, "#6060e0");
  dot(7, 1, 3, 5, "#4040c0"); dot(7, 1, 4, 5, "#4040c0");

  // ============ ROW 2: PLAYER & MONSTERS ============

  // (0,2) Player — armored knight with sword & shield
  // Helmet
  dot(0, 2, 3, 0, "#707070"); dot(0, 2, 4, 0, "#707070");
  dot(0, 2, 2, 0, "#808080"); dot(0, 2, 5, 0, "#808080");
  // Face
  dot(0, 2, 3, 1, "#d0a878"); dot(0, 2, 4, 1, "#d0a878");
  // Eyes
  dot(0, 2, 3, 1, "#000000"); dot(0, 2, 4, 1, "#000000");
  // Chest armor
  for (let j = 2; j <= 4; j++) {
    dot(0, 2, 2, j, "#707070"); dot(0, 2, 3, j, "#909090");
    dot(0, 2, 4, j, "#909090"); dot(0, 2, 5, j, "#707070");
  }
  // Belt
  for (let i = 2; i <= 5; i++) dot(0, 2, i, 4, "#804020");
  dot(0, 2, 3, 4, "#c0a000"); dot(0, 2, 4, 4, "#c0a000"); // buckle
  // Shield (left)
  dot(0, 2, 0, 2, "#2020a0"); dot(0, 2, 0, 3, "#2020a0"); dot(0, 2, 0, 4, "#2020a0");
  dot(0, 2, 1, 2, "#3030c0"); dot(0, 2, 1, 3, "#3030c0"); dot(0, 2, 1, 4, "#3030c0");
  dot(0, 2, 1, 3, "#c0c000"); // shield emblem
  // Sword (right)
  dot(0, 2, 7, 0, "#c0c0c0"); dot(0, 2, 7, 1, "#b0b0b0"); dot(0, 2, 7, 2, "#b0b0b0");
  dot(0, 2, 6, 3, "#804020"); dot(0, 2, 7, 3, "#804020"); // crossguard
  // Legs
  dot(0, 2, 3, 5, "#606060"); dot(0, 2, 4, 5, "#606060");
  dot(0, 2, 2, 6, "#606060"); dot(0, 2, 5, 6, "#606060");
  // Boots
  dot(0, 2, 2, 7, "#402010"); dot(0, 2, 5, 7, "#402010");
  dot(0, 2, 1, 7, "#402010"); dot(0, 2, 6, 7, "#402010");

  // (1,2) Orc — green brute
  dot(1, 2, 3, 0, "#408020"); dot(1, 2, 4, 0, "#408020");
  dot(1, 2, 2, 1, "#408020"); dot(1, 2, 5, 1, "#408020");
  dot(1, 2, 3, 1, "#408020"); dot(1, 2, 4, 1, "#408020");
  dot(1, 2, 3, 1, "#c00000"); dot(1, 2, 4, 1, "#c00000"); // red eyes
  for (let j = 2; j <= 4; j++) rect(1, 2, 1, j, 6, 1, "#408020");
  dot(1, 2, 0, 3, "#408020"); dot(1, 2, 7, 3, "#408020"); // big arms
  dot(1, 2, 0, 4, "#408020"); dot(1, 2, 7, 4, "#408020");
  rect(1, 2, 2, 5, 2, 2, "#408020"); rect(1, 2, 4, 5, 2, 2, "#408020");
  dot(1, 2, 2, 7, "#404040"); dot(1, 2, 5, 7, "#404040");

  // (2,2) Scorpion — brown arachnid
  rect(2, 2, 2, 3, 4, 3, "#804020");
  dot(2, 2, 3, 2, "#804020"); dot(2, 2, 4, 2, "#804020"); // head
  dot(2, 2, 3, 2, "#c00000"); dot(2, 2, 4, 2, "#c00000"); // eyes
  // Pincers
  dot(2, 2, 1, 1, "#804020"); dot(2, 2, 6, 1, "#804020");
  dot(2, 2, 0, 0, "#804020"); dot(2, 2, 7, 0, "#804020");
  // Tail (curving up)
  dot(2, 2, 3, 6, "#804020"); dot(2, 2, 3, 7, "#804020");
  dot(2, 2, 2, 7, "#804020"); dot(2, 2, 1, 7, "#c00000"); // stinger
  // Legs
  dot(2, 2, 1, 4, "#603010"); dot(2, 2, 6, 4, "#603010");
  dot(2, 2, 0, 5, "#603010"); dot(2, 2, 7, 5, "#603010");
  dot(2, 2, 1, 6, "#603010"); dot(2, 2, 6, 6, "#603010");

  // (3,2) Skeleton — white bones
  dot(3, 2, 3, 0, "#e0e0e0"); dot(3, 2, 4, 0, "#e0e0e0");
  dot(3, 2, 3, 1, "#e0e0e0"); dot(3, 2, 4, 1, "#e0e0e0");
  dot(3, 2, 3, 1, "#000000"); dot(3, 2, 4, 1, "#000000"); // eyes
  // Ribcage
  for (let j = 2; j <= 4; j++) {
    dot(3, 2, 2, j, "#e0e0e0"); dot(3, 2, 5, j, "#e0e0e0");
    dot(3, 2, 3, j, "#d0d0d0"); dot(3, 2, 4, j, "#d0d0d0");
  }
  // Arms
  dot(3, 2, 1, 2, "#e0e0e0"); dot(3, 2, 6, 2, "#e0e0e0");
  dot(3, 2, 0, 3, "#e0e0e0"); dot(3, 2, 7, 3, "#e0e0e0");
  // Spine/pelvis
  dot(3, 2, 3, 5, "#d0d0d0"); dot(3, 2, 4, 5, "#d0d0d0");
  // Legs
  dot(3, 2, 2, 6, "#e0e0e0"); dot(3, 2, 5, 6, "#e0e0e0");
  dot(3, 2, 2, 7, "#e0e0e0"); dot(3, 2, 5, 7, "#e0e0e0");

  // (4,2) Demon — red with horns
  dot(4, 2, 1, 0, "#c00000"); dot(4, 2, 6, 0, "#c00000"); // horns
  dot(4, 2, 3, 0, "#c00000"); dot(4, 2, 4, 0, "#c00000");
  dot(4, 2, 2, 1, "#c00000"); dot(4, 2, 5, 1, "#c00000");
  dot(4, 2, 3, 1, "#c00000"); dot(4, 2, 4, 1, "#c00000");
  dot(4, 2, 3, 1, "#ffff00"); dot(4, 2, 4, 1, "#ffff00"); // yellow eyes
  for (let j = 2; j <= 4; j++) rect(4, 2, 2, j, 4, 1, "#c00000");
  dot(4, 2, 1, 3, "#c00000"); dot(4, 2, 6, 3, "#c00000");
  // Wings
  dot(4, 2, 0, 2, "#800000"); dot(4, 2, 7, 2, "#800000");
  dot(4, 2, 0, 3, "#800000"); dot(4, 2, 7, 3, "#800000");
  // Legs
  dot(4, 2, 2, 5, "#c00000"); dot(4, 2, 5, 5, "#c00000");
  dot(4, 2, 2, 6, "#c00000"); dot(4, 2, 5, 6, "#c00000");
  // Tail
  dot(4, 2, 6, 5, "#c00000"); dot(4, 2, 7, 6, "#c00000"); dot(4, 2, 7, 7, "#c00000");

  // (5,2) Sphinx — tan lion body, human face
  dot(5, 2, 3, 0, "#d0a060"); dot(5, 2, 4, 0, "#d0a060");
  dot(5, 2, 3, 1, "#d0a878"); dot(5, 2, 4, 1, "#d0a878"); // face
  dot(5, 2, 3, 1, "#000000"); dot(5, 2, 4, 1, "#000000");
  for (let j = 2; j <= 5; j++) rect(5, 2, 1, j, 6, 1, "#d0a060");
  // Paws
  dot(5, 2, 1, 6, "#d0a060"); dot(5, 2, 2, 6, "#d0a060");
  dot(5, 2, 5, 6, "#d0a060"); dot(5, 2, 6, 6, "#d0a060");
  dot(5, 2, 1, 7, "#d0a060"); dot(5, 2, 6, 7, "#d0a060");

  // (6,2) Statue — gray figure on pedestal
  rect(6, 2, 1, 6, 6, 2, "#909090"); // pedestal
  dot(6, 2, 3, 1, "#b0b0b0"); dot(6, 2, 4, 1, "#b0b0b0");
  for (let j = 2; j <= 5; j++) {
    dot(6, 2, 3, j, "#b0b0b0"); dot(6, 2, 4, j, "#b0b0b0");
  }
  dot(6, 2, 2, 3, "#b0b0b0"); dot(6, 2, 5, 3, "#b0b0b0"); // arms

  // (7,2) Cyclops — big tan monster
  rect(7, 2, 2, 0, 4, 2, "#c0a060");
  dot(7, 2, 3, 0, "#000000"); // single eye!
  dot(7, 2, 4, 0, "#000000");
  rect(7, 2, 1, 2, 6, 4, "#c0a060");
  dot(7, 2, 0, 3, "#c0a060"); dot(7, 2, 7, 3, "#c0a060"); // arms
  dot(7, 2, 0, 4, "#c0a060"); dot(7, 2, 7, 4, "#c0a060");
  rect(7, 2, 2, 6, 2, 2, "#c0a060"); rect(7, 2, 4, 6, 2, 2, "#c0a060");

  // ============ ROW 3: DUNGEON TERRAIN ============

  // (0,3) Dungeon wall — dark brick
  rect(0, 3, 0, 0, 8, 8, "#505050");
  for (let i = 0; i < 8; i++) {
    dot(0, 3, i, 0, "#383838"); dot(0, 3, i, 4, "#383838");
  }
  for (let j = 0; j < 8; j++) {
    dot(0, 3, 0, j, "#383838"); dot(0, 3, 7, j, "#383838");
  }
  dot(0, 3, 4, 2, "#383838"); dot(0, 3, 2, 6, "#383838");
  // Highlight
  dot(0, 3, 1, 1, "#686868"); dot(0, 3, 5, 5, "#686868");

  // (1,3) Dungeon dark — very dark
  rect(1, 3, 0, 0, 8, 8, "#181818");

  // (2,3) Dungeon pillar — stone column
  rect(2, 3, 0, 0, 8, 8, "#484848"); // dark floor bg
  // Column
  rect(2, 3, 2, 0, 4, 8, "#909090");
  for (let j = 0; j < 8; j++) { dot(2, 3, 2, j, "#707070"); dot(2, 3, 5, j, "#707070"); }
  // Capital
  rect(2, 3, 1, 0, 6, 1, "#a0a0a0");
  rect(2, 3, 1, 7, 6, 1, "#a0a0a0");

  // (3,3) Brick wall
  rect(3, 3, 0, 0, 8, 8, "#906040");
  for (let i = 0; i < 8; i++) {
    dot(3, 3, i, 0, "#704020"); dot(3, 3, i, 3, "#704020"); dot(3, 3, i, 7, "#704020");
  }
  dot(3, 3, 0, 1, "#704020"); dot(3, 3, 0, 2, "#704020");
  dot(3, 3, 4, 1, "#704020"); dot(3, 3, 4, 2, "#704020");
  dot(3, 3, 2, 4, "#704020"); dot(3, 3, 2, 5, "#704020"); dot(3, 3, 2, 6, "#704020");
  dot(3, 3, 6, 4, "#704020"); dot(3, 3, 6, 5, "#704020"); dot(3, 3, 6, 6, "#704020");

  // (4,3) - (7,3): remaining dark floors with slight variations
  for (let col = 4; col <= 7; col++) {
    rect(col, 3, 0, 0, 8, 8, "#404040");
    const offset = col - 4;
    dot(col, 3, 1 + offset, 2, "#505050");
    dot(col, 3, 5 - offset, 5, "#505050");
  }

  // ============ OVERWRITES — repurposed tiles ============

  // (7,1) Iron Key — overwrite magic_gem art
  rect(7, 1, 0, 0, 8, 8, "#ffffff");
  // Bow (loop)
  for (const [kx, ky] of [[1,2],[2,1],[3,1],[4,1],[5,2],[5,3],[4,4],[3,4],[2,4],[1,3]]) {
    dot(7, 1, kx, ky, "#806020");
  }
  dot(7, 1, 3, 2, "#a08040"); dot(7, 1, 4, 2, "#a08040");
  dot(7, 1, 3, 3, "#a08040"); dot(7, 1, 4, 3, "#a08040");
  // Shaft
  for (let i = 5; i <= 7; i++) dot(7, 1, i, 3, "#806020");
  // Teeth
  dot(7, 1, 6, 4, "#806020"); dot(7, 1, 7, 4, "#806020");
  dot(7, 1, 5, 5, "#806020");

  // (7,3) Gold pile — overwrite ancient_map art
  rect(7, 3, 0, 0, 8, 8, "#383838"); // dark floor bg
  // pile of coins
  for (const [gx, gy] of [
    [2, 5], [3, 5], [4, 5], [5, 5],
    [3, 4], [4, 4], [2, 4], [5, 4],
    [3, 3], [4, 3],
    [1, 6], [6, 6], [2, 6], [5, 6], [3, 6], [4, 6],
  ]) {
    dot(7, 3, gx, gy, "#e0c000");
  }
  // highlights
  dot(7, 3, 3, 3, "#ffe040"); dot(7, 3, 4, 4, "#ffe040");
  dot(7, 3, 2, 5, "#ffe040"); dot(7, 3, 5, 5, "#ffe040");
  // shadow under
  dot(7, 3, 0, 7, "#705000"); dot(7, 3, 7, 7, "#705000");
  for (let i = 1; i <= 6; i++) dot(7, 3, i, 7, "#a07000");

  // (6,0) Locked Door — overwrite gate art
  rect(6, 0, 0, 0, 8, 8, "#60a060"); // grass border
  // Door frame
  rect(6, 0, 1, 1, 6, 7, "#603010");
  // Door panels
  rect(6, 0, 2, 2, 4, 5, "#804020");
  for (let j = 2; j <= 6; j++) dot(6, 0, 4, j, "#603010");
  for (let i = 2; i <= 5; i++) { dot(6, 0, i, 2, "#603010"); dot(6, 0, i, 6, "#603010"); }
  // Lock plate
  dot(6, 0, 5, 4, "#c0c000");
  dot(6, 0, 5, 5, "#c0c000");
  // Hinges
  dot(6, 0, 1, 2, "#404040"); dot(6, 0, 1, 6, "#404040");

  // ── Row 4: town nature + objects ──

  // (0,4) Water — explicit blue background (filled by castle blit below)
  rect(0, 4, 0, 0, 8, 8, "#3878c8");
  for (const [wx, wy] of [[1,2],[3,1],[5,2],[2,4],[4,5],[6,4],[1,6],[3,7],[5,6]])
    dot(0, 4, wx, wy, "#5090e0");

  // (1,4) Tree
  rect(1, 4, 3, 5, 2, 3, "#6b3a2a"); // trunk
  rect(1, 4, 1, 1, 6, 5, "#1e6b1e"); // crown
  dot(1, 4, 0, 2, "#1e6b1e"); dot(1, 4, 7, 2, "#1e6b1e");
  dot(1, 4, 0, 3, "#1e6b1e"); dot(1, 4, 7, 3, "#1e6b1e");
  dot(1, 4, 2, 1, "#4a9c4a"); dot(1, 4, 3, 1, "#4a9c4a"); // highlights
  dot(1, 4, 2, 2, "#4a9c4a"); dot(1, 4, 3, 2, "#4a9c4a");

  // (2,4) Bush
  rect(2, 4, 0, 4, 8, 4, "#286028"); // base
  rect(2, 4, 1, 2, 2, 3, "#3a8c3a"); // left mound
  rect(2, 4, 5, 2, 2, 3, "#3a8c3a"); // right mound
  rect(2, 4, 3, 1, 2, 4, "#3a8c3a"); // center mound
  dot(2, 4, 2, 3, "#5ab05a"); dot(2, 4, 5, 3, "#5ab05a"); // highlights
  dot(2, 4, 3, 2, "#5ab05a"); dot(2, 4, 4, 2, "#5ab05a");

  // (3,4) Crate — brown wooden box
  rect(3, 4, 0, 0, 8, 8, "#8b5e3c");
  for (let i = 0; i < 8; i++) {
    dot(3, 4, i, 0, "#5c3a1e"); dot(3, 4, i, 7, "#5c3a1e");
    dot(3, 4, 0, i, "#5c3a1e"); dot(3, 4, 7, i, "#5c3a1e");
    dot(3, 4, 4, i, "#5c3a1e");
  }
  for (let i = 1; i < 4; i++) { dot(3, 4, i, 3, "#5c3a1e"); dot(3, 4, i+4, 3, "#5c3a1e"); }
  dot(3, 4, 1, 1, "#a07040"); dot(3, 4, 5, 1, "#a07040"); // highlights

  // (4,4) Fountain
  rect(4, 4, 0, 0, 8, 8, "#909090"); // stone surround
  rect(4, 4, 1, 1, 6, 6, "#808080");
  rect(4, 4, 2, 2, 4, 4, "#3878c8"); // blue water
  rect(4, 4, 3, 3, 2, 2, "#60a0e0"); // lighter center
  dot(4, 4, 3, 1, "#a0c8ff"); dot(4, 4, 4, 1, "#a0c8ff"); // spray
  dot(4, 4, 3, 0, "#c0e0ff"); dot(4, 4, 4, 0, "#c0e0ff");

  // ── Blit sprites from castle.png ──
  // KEY: remove white bg at FULL SOURCE RESOLUTION (2048×2048) before any scaling.
  // At source scale, white cell backgrounds are solid 255 — no anti-aliasing confusion.
  // Downscaling transparent-bg sprites then composites cleanly over tiles.
  if (castleImg) {
    const SW = castleImg.naturalWidth  || 2048;
    const SH = castleImg.naturalHeight || 2048;

    // Step 1: draw full castle sheet onto processing canvas
    const proc = document.createElement("canvas");
    proc.width = SW; proc.height = SH;
    const pctx = proc.getContext("2d")!;
    pctx.drawImage(castleImg, 0, 0);

    // Step 2: remove all near-white pixels at source resolution
    // Character/item cell backgrounds are solid white (255,255,255) at this scale.
    // Threshold 240 is safe — actual sprite art uses saturated colors well below this.
    const pd = pctx.getImageData(0, 0, SW, SH);
    const data = pd.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
        data[i + 3] = 0;
      }
    }
    pctx.putImageData(pd, 0, 0);

    // Step 3: blit from processed (transparent-bg) source to atlas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const BM = 6; // source border margin — skip 6px at each edge to avoid cell border lines
    const blit = (csx: number, csy: number, csw: number, csh: number, tCol: number, tRow: number) => {
      ctx.clearRect(tCol * T, tRow * T, T, T);
      ctx.drawImage(proc, csx + BM, csy + BM, csw - BM*2, csh - BM*2, tCol * T, tRow * T, T, T);
      // Remove near-white survivors from antialiased downscale + low-alpha fringe
      const sd = ctx.getImageData(tCol * T, tRow * T, T, T);
      const d = sd.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 230 && d[i+1] > 230 && d[i+2] > 230) { d[i+3] = 0; continue; }
        if (d[i+3] < 50) d[i+3] = 0;
      }
      ctx.putImageData(sd, tCol * T, tRow * T);
    };

    // Characters row 0
    blit(   0,    0, 512, 512,  0, 2);  // player
    blit( 512,    0, 512, 512,  7, 2);  // golem → cyclops
    blit(1024,    0, 512, 512,  4, 2);  // purple bat → demon
    blit(1536,    0, 512, 512,  5, 2);  // armored gargoyle → sphinx
    // Characters row 1
    blit(   0,  512, 512, 512,  2, 2);  // slime → scorpion
    blit( 512,  512, 512, 512,  3, 2);  // shadow bat → skeleton
    blit(1024,  512, 512, 512,  1, 2);  // green goblin → orc
    blit(1536,  512, 512, 512,  4, 1);  // orc warrior → guard
    // Items row 2
    blit(   0, 1024, 512, 512,  5, 1);  // battleaxe → dagger
    blit(1024, 1024, 512, 512,  3, 1);  // backpack → locked_chest
    blit(1536, 1024, 512, 512,  7, 3);  // gold sack → gold
    // Terrain (bg intact — these are full-colour tile textures, not cell-on-white)
    blit( 512, 1536, 256, 256,  0, 0);  // castle grass
    blit(   0, 1536, 256, 256,  0, 4);  // castle water
    blit(1536, 1536, 512, 512,  5, 0);  // castle building
  }

  return c.toDataURL();
}
