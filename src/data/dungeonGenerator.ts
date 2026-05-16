import { TileMap, TileDef } from "../model/TileMap";
import { Entity, MapInstance } from "../model/GameState";

export const FINAL_LEVEL = 6;

export type DungeonSize = "small" | "medium" | "large";
export type DungeonDifficulty = "easy" | "hard" | "ultra";

interface Room { x: number; y: number; w: number; h: number; }
interface EnemyTemplate {
  sprite: string; name: string;
  hp: number; atk: number; def: number;
  goldMin: number; goldMax: number;
  xpReward: number;
  rangedAtk?: number;
}

const ENEMY_POOLS: Record<DungeonDifficulty, EnemyTemplate[]> = {
  easy: [
    { sprite:"scorpion", name:"Scorpion", hp:5,  atk:1, def:0, goldMin:5,  goldMax:15,  xpReward:12 },
    { sprite:"orc",      name:"Goblin",   hp:6,  atk:2, def:0, goldMin:8,  goldMax:20,  xpReward:15 },
  ],
  hard: [
    { sprite:"orc",      name:"Orc",      hp:10, atk:3, def:1, goldMin:15, goldMax:35,  xpReward:30 },
    { sprite:"skeleton", name:"Skeleton", hp:8,  atk:2, def:1, goldMin:12, goldMax:30,  xpReward:28 },
    { sprite:"cyclops",  name:"Cyclops",  hp:14, atk:4, def:2, goldMin:20, goldMax:50,  xpReward:45 },
  ],
  ultra: [
    { sprite:"demon",    name:"Demon",    hp:20, atk:5, def:2, goldMin:40, goldMax:80,  xpReward:80 },
    { sprite:"cyclops",  name:"Cyclops",  hp:18, atk:5, def:3, goldMin:35, goldMax:70,  xpReward:70 },
    { sprite:"sphinx",   name:"Gargoyle", hp:12, atk:4, def:2, goldMin:25, goldMax:60,  xpReward:60 },
  ],
};

// Wizards appear only in medium/large dungeons; keyed by difficulty
const WIZARD_TEMPLATES: Record<DungeonDifficulty, EnemyTemplate> = {
  easy:  { sprite:"villager", name:"Dark Mage",  hp:10, atk:0, def:0, goldMin:15, goldMax:35,  xpReward:40,  rangedAtk:5  },
  hard:  { sprite:"villager", name:"Dark Mage",  hp:14, atk:0, def:1, goldMin:25, goldMax:55,  xpReward:60,  rangedAtk:9  },
  ultra: { sprite:"villager", name:"Void Mage",  hp:20, atk:0, def:2, goldMin:45, goldMax:90,  xpReward:100, rangedAtk:15 },
};

const BOSS_TEMPLATES: Record<DungeonDifficulty, EnemyTemplate> = {
  easy:  { sprite:"cyclops", name:"Cave Troll",    hp:30, atk:4, def:2, goldMin:60,  goldMax:120, xpReward:120 },
  hard:  { sprite:"demon",   name:"Dungeon Lord",  hp:55, atk:6, def:4, goldMin:120, goldMax:250, xpReward:300 },
  ultra: { sprite:"sphinx",  name:"Void Archdemon",hp:90, atk:9, def:6, goldMin:250, goldMax:500, xpReward:600 },
};

const FINAL_BOSS_TEMPLATE: EnemyTemplate = {
  sprite: "sphinx", name: "The Archmage",
  hp: 150, atk: 12, def: 8,
  goldMin: 500, goldMax: 1000, xpReward: 2000,
};

const ITEM_POOLS: Record<DungeonDifficulty, Partial<Entity>[]> = {
  easy: [
    { sprite:"potion",      name:"Healing Potion", healAmt:8,           price:20 },
    { sprite:"rusty_sword", name:"Rusted Sword",   slot:"weapon", atk:3, price:15 },
    { sprite:"guard",       name:"Padded Vest",    slot:"armor",  def:1, price:20 },
  ],
  hard: [
    { sprite:"rusty_sword", name:"Iron Sword",   slot:"weapon", atk:5, price:50  },
    { sprite:"guard",       name:"Leather Armor", slot:"armor",  def:2, price:40  },
    { sprite:"potion",      name:"Healing Potion", healAmt:8,          price:20  },
    { sprite:"magic_gem",   name:"Wand of Bolts",  slot:"weapon", isWand:true, price:150 },
  ],
  ultra: [
    { sprite:"rusty_sword", name:"Steel Sword",    slot:"weapon", atk:8, price:120 },
    { sprite:"guard",       name:"Chain Mail",      slot:"armor",  def:4, price:90  },
    { sprite:"potion",      name:"Greater Potion",  healAmt:16,          price:40  },
    { sprite:"ancient_map", name:"Strength Scroll", boostStat:"str", boostAmt:2, price:80 },
    { sprite:"locked_chest",name:"Iron Shield",     slot:"shield", def:2, price:45  },
  ],
};

const TILESET = new Map<number, TileDef>([
  [0, { sprite:"dun_floor",  solid:false, label:"floor"  }],
  [1, { sprite:"dun_wall",   solid:true,  label:"wall"   }],
  [2, { sprite:"dun_pillar", solid:true,  label:"pillar" }],
]);

function rand(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function roomCenter(r: Room) { return { cx: r.x + Math.floor(r.w / 2), cy: r.y + Math.floor(r.h / 2) }; }
function roomDist2(a: Room, b: Room) {
  const dx = (a.x + a.w / 2) - (b.x + b.w / 2);
  const dy = (a.y + a.h / 2) - (b.y + b.h / 2);
  return dx * dx + dy * dy;
}

function findFloorInRoom(grid: number[][], room: Room): { x: number; y: number } {
  for (let a = 0; a < 30; a++) {
    const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
    const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
    if (grid[y]?.[x] === 0) return { x, y };
  }
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++)
      if (grid[y]?.[x] === 0) return { x, y };
  return { x: room.x + Math.floor(room.w / 2), y: room.y + Math.floor(room.h / 2) };
}

function findFloorInRoomExcluding(grid: number[][], room: Room, ex: number, ey: number): { x: number; y: number } {
  for (let a = 0; a < 40; a++) {
    const x = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
    const y = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
    if (grid[y]?.[x] === 0 && !(x === ex && y === ey)) return { x, y };
  }
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++)
      if (grid[y]?.[x] === 0 && !(x === ex && y === ey)) return { x, y };
  return { x: ex + 1 < room.x + room.w - 1 ? ex + 1 : ex - 1, y: ey };
}

/** Returns first floor tile near preferX/Y not occupied by solid entities. */
export function findSpawn(map: TileMap, entities: Entity[], preferX: number, preferY: number): {x:number;y:number} {
  for (const [dx, dy] of [[0,0],[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]) {
    const x = preferX + dx, y = preferY + dy;
    if (!map.isSolid(x, y) && !entities.some(e => e.x === x && e.y === y && e.type !== "item" && e.type !== "treasure"))
      return { x, y };
  }
  for (let y = 1; y < map.height - 1; y++)
    for (let x = 1; x < map.width - 1; x++)
      if (!map.isSolid(x, y) && !entities.some(e => e.x === x && e.y === y))
        return { x, y };
  return { x: preferX, y: preferY };
}

export function generateDungeon(
  size: DungeonSize,
  difficulty: DungeonDifficulty,
  levelNum: number,
  prevMapId: string,
  prevX: number,
  prevY: number,
  nextMapId: string | null,
): MapInstance {
  const [W, H]   = size === "small" ? [26, 22] : size === "medium" ? [42, 34] : [60, 48];
  const maxRooms = size === "small" ? 7 : size === "medium" ? 14 : 22;
  const enemyPer = difficulty === "easy" ? 1 : difficulty === "hard" ? 2 : 3;
  // Extra corridors create loops and multiple routes to boss on larger maps
  const extraCorridors = size === "small" ? 0 : size === "medium" ? 3 : 6;

  const grid: number[][] = Array.from({ length: H }, () => new Array(W).fill(1));

  function carveRect(rx: number, ry: number, rw: number, rh: number) {
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) grid[y][x] = 0;
  }
  function carveH(x1: number, x2: number, y: number) {
    for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++) grid[y][x] = 0;
  }
  function carveV(y1: number, y2: number, x: number) {
    for (let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++) grid[y][x] = 0;
  }
  function carveDiag(x1: number, y1: number, x2: number, y2: number) {
    let cx = x1, cy = y1;
    const dx = Math.sign(x2 - cx), dy = Math.sign(y2 - cy);
    while (cx !== x2 || cy !== y2) {
      grid[cy][cx] = 0;
      if (cx !== x2) { cx += dx; grid[cy][cx] = 0; }
      if (cy !== y2) { cy += dy; grid[cy][cx] = 0; }
    }
    grid[cy][cx] = 0;
  }
  function carveRoomShape(rx: number, ry: number, rw: number, rh: number): void {
    carveRect(rx, ry, rw, rh);
    if (rw < 6 || rh < 5) return;
    const r = Math.random();
    if (r < 0.42) return; // plain rect

    if (r < 0.70) {
      // L-shape: fill back one corner (~1/3 of room)
      const qw = Math.max(2, Math.floor(rw / 3));
      const qh = Math.max(2, Math.floor(rh / 3));
      const corner = Math.floor(Math.random() * 4);
      const x1 = corner % 2 === 0 ? rx : rx + rw - qw;
      const y1 = corner < 2    ? ry : ry + rh - qh;
      for (let y = y1; y < y1 + qh; y++)
        for (let x = x1; x < x1 + qw; x++)
          grid[y][x] = 1;
      return;
    }

    // Octagonal: diagonal corner cuts
    const c = Math.max(1, Math.floor(Math.min(rw, rh) / 4));
    for (let i = 0; i < c; i++) {
      for (let j = 0; j < c - i; j++) {
        grid[ry + i][rx + j] = 1;                    // NW
        grid[ry + i][rx + rw - 1 - j] = 1;           // NE
        grid[ry + rh - 1 - i][rx + j] = 1;           // SW
        grid[ry + rh - 1 - i][rx + rw - 1 - j] = 1; // SE
      }
    }
  }

  function connectRooms(a: Room, b: Room) {
    const { cx: ax, cy: ay } = roomCenter(a);
    const { cx: bx, cy: by } = roomCenter(b);
    const r = Math.random();
    if      (r < 0.25) { carveDiag(ax, ay, bx, by); }
    else if (r < 0.6)  { carveH(ax, bx, ay); carveV(ay, by, bx); }
    else               { carveV(ay, by, ax); carveH(ax, bx, by); }
  }

  // ── Room generation ──────────────────────────────────────────────
  // Room[0] is always the guaranteed entry room near (3,3).
  // Stairs-up goes at exactly (3,3); player spawns adjacent via findSpawn.
  const entryRoom: Room = { x: 2, y: 2, w: 5, h: 5 };
  carveRect(entryRoom.x, entryRoom.y, entryRoom.w, entryRoom.h);
  const rooms: Room[] = [entryRoom];

  const maxW = size === "large" ? 10 : 7;
  const maxH = size === "large" ? 8  : 6;

  for (let attempt = 0; attempt < 400 && rooms.length < maxRooms; attempt++) {
    const rw = rand(4, maxW);
    const rh = rand(4, maxH);
    const rx = rand(1, W - rw - 2);
    const ry = rand(1, H - rh - 2);
    if (rooms.some(r => rx <= r.x + r.w && rx + rw >= r.x && ry <= r.y + r.h && ry + rh >= r.y)) continue;
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
    carveRoomShape(rx, ry, rw, rh);
  }

  // Guarantee at least 2 rooms so boss is never in the entry room
  if (rooms.length < 2) {
    const fr: Room = { x: W - 8, y: H - 8, w: 5, h: 5 };
    carveRect(fr.x, fr.y, fr.w, fr.h);
    rooms.push(fr);
  }

  // ── Boss room = room farthest from entry room ────────────────────
  let bossIdx = 1, maxDist = -1;
  for (let i = 1; i < rooms.length; i++) {
    const d = roomDist2(entryRoom, rooms[i]);
    if (d > maxDist) { maxDist = d; bossIdx = i; }
  }
  if (bossIdx !== rooms.length - 1)
    [rooms[bossIdx], rooms[rooms.length - 1]] = [rooms[rooms.length - 1], rooms[bossIdx]];

  // ── Corridor carving ─────────────────────────────────────────────
  // Primary chain guarantees every room is reachable
  for (let i = 1; i < rooms.length; i++) connectRooms(rooms[i-1], rooms[i]);

  // Extra corridors create loops / multiple routes to boss on medium & large
  if (extraCorridors > 0) {
    const paired = new Set<string>();
    for (let i = 1; i < rooms.length; i++) paired.add(`${i-1}-${i}`);
    let added = 0;
    for (let attempt = 0; attempt < 200 && added < extraCorridors; attempt++) {
      const a = Math.floor(Math.random() * rooms.length);
      const b = Math.floor(Math.random() * rooms.length);
      if (a === b) continue;
      const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
      if (paired.has(key)) continue;
      paired.add(key);
      connectRooms(rooms[a], rooms[b]);
      added++;
    }
  }

  // Pillars in large rooms
  for (const r of rooms) {
    if (r.w >= 6 && r.h >= 5) {
      grid[r.y+1][r.x+1]     = 2;
      grid[r.y+1][r.x+r.w-2] = 2;
      grid[r.y+r.h-2][r.x+1] = 2;
      grid[r.y+r.h-2][r.x+r.w-2] = 2;
    }
  }

  const map = new TileMap(grid, TILESET, true);
  const entities: Entity[] = [];
  const enemyPool = ENEMY_POOLS[difficulty];
  const itemPool  = ITEM_POOLS[difficulty];

  // ── Entry room ────────────────────────────────────────────────────
  // Stairs-up is ALWAYS at (3,3) — inside entryRoom, adjacent to player spawn
  entities.push({
    x: 3, y: 3,
    type: "portal", sprite: "cave_entrance",
    name: levelNum === 1 ? "Exit to Town" : "Stairs Up",
    behavior: { targetMap: prevMapId, targetX: prevX, targetY: prevY },
  });

  // ── Middle rooms ─────────────────────────────────────────────────
  const wizardTmpl = size !== "small" ? WIZARD_TEMPLATES[difficulty] : null;
  for (let i = 1; i < rooms.length - 1; i++) {
    const room = rooms[i];
    for (let e = 0; e < enemyPer; e++) {
      // One wizard per dungeon (roughly 25% chance per room on medium/large)
      const useWizard = wizardTmpl && Math.random() < 0.25 &&
        !entities.some(en => en.rangedAtk !== undefined);
      const tmpl = useWizard ? wizardTmpl! : pick(enemyPool);
      const pos = findFloorInRoom(grid, room);
      const enemyLoot: Entity[] = [];
      if (Math.random() < 0.60) enemyLoot.push({ x:0, y:0, type:"treasure", sprite:"gold", name:"Gold", gold: rand(tmpl.goldMin, tmpl.goldMax) });
      if (Math.random() < 0.25) enemyLoot.push({ x:0, y:0, type:"item" as const, ...pick(itemPool) });
      entities.push({
        x: pos.x, y: pos.y,
        type: "enemy", sprite: tmpl.sprite, name: tmpl.name,
        hp: tmpl.hp, maxHp: tmpl.hp, atk: tmpl.atk, def: tmpl.def, xpReward: tmpl.xpReward,
        ...(tmpl.rangedAtk !== undefined ? { rangedAtk: tmpl.rangedAtk } : {}),
        loot: enemyLoot,
      });
    }
    // Rare floor item only — no guaranteed gold pile
    if (Math.random() < 0.15) {
      const ipos = findFloorInRoom(grid, room);
      entities.push({ x: ipos.x, y: ipos.y, type:"item", ...pick(itemPool) } as Entity);
    }
  }

  // ── Supply crates in side rooms ───────────────────────────────────
  // Rooms 2..n-2: out-of-the-way rooms reward thorough exploration
  const sideRooms = rooms.slice(2, rooms.length - 2);
  const numCrates = Math.min(sideRooms.length, size === "small" ? 1 : 2);
  const cratePool = [...sideRooms];
  for (let c = 0; c < numCrates && cratePool.length > 0; c++) {
    const ri = Math.floor(Math.random() * cratePool.length);
    const cr = cratePool.splice(ri, 1)[0];
    const cp = findFloorInRoom(grid, cr);
    const crateLoot: Entity[] = [{ x:0, y:0, type:"treasure", sprite:"gold", name:"Gold Coins", gold: rand(15, 50) }];
    if (Math.random() < 0.70) crateLoot.push({ x:0, y:0, type:"item" as const, ...pick(itemPool) });
    entities.push({ x: cp.x, y: cp.y, type:"chest", sprite:"crate", name:"Supply Crate", loot: crateLoot });
  }

  // ── Boss room ─────────────────────────────────────────────────────
  const lr   = rooms[rooms.length - 1];
  const isFinalLevel = levelNum >= FINAL_LEVEL;
  const boss = isFinalLevel ? FINAL_BOSS_TEMPLATE : BOSS_TEMPLATES[difficulty];
  const bossPos = findFloorInRoom(grid, lr);

  const bossLoot: Entity[] = [
    { x:0, y:0, type:"treasure", sprite:"gold", name:"Boss Hoard", gold: rand(boss.goldMin, boss.goldMax) },
  ];
  if (isFinalLevel) {
    bossLoot.push({ x:0, y:0, type:"item" as const, sprite:"portal", name:"Archmage's Crown", isFinalItem: true, price: 9999 });
  } else {
    bossLoot.push(...itemPool.slice(0, 1).map(it => ({ x:0, y:0, type:"item" as const, ...it })) as Entity[]);
  }

  entities.push({
    x: bossPos.x, y: bossPos.y,
    type: "enemy", sprite: boss.sprite, name: `${boss.name} [BOSS]`,
    hp: boss.hp, maxHp: boss.hp, atk: boss.atk, def: boss.def, xpReward: boss.xpReward,
    loot: bossLoot,
  });

  // Stairs-down only if not the final level
  if (nextMapId !== null) {
    const stairsPos = findFloorInRoomExcluding(grid, lr, bossPos.x, bossPos.y);
    entities.push({
      x: stairsPos.x, y: stairsPos.y,
      type: "portal", sprite: "portal", name: "Stairs Down",
      behavior: { targetMap: nextMapId, targetX: 3, targetY: 3 },
    });
  }

  return { map, entities };
}
