import { TileMap } from "./TileMap";

export type EquipSlot = "weapon" | "shield" | "armor" | "head";

export interface Projectile {
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
  ownerId: string;
  fromPlayer?: boolean;
}

export type EntityType =
  | "player"
  | "npc"
  | "item"
  | "portal"
  | "door"
  | "enemy"
  | "treasure"
  | "building"
  | "chest";

export interface Entity {
  x: number;
  y: number;
  type: EntityType;
  sprite: string;
  name?: string;
  slot?: EquipSlot;
  keyId?: string;
  hp?: number;
  maxHp?: number;
  atk?: number;
  def?: number;
  gold?: number;
  loot?: Entity[];
  aware?: boolean;
  healAmt?: number;
  price?: number;
  boostStat?: "str" | "int" | "con" | "dex";
  boostAmt?: number;
  xpReward?: number;
  rangedAtk?: number;
  tileW?: number;
  tileH?: number;
  hideWhenPlayerIn?: { x: number; y: number; w: number; h: number };
  opened?: boolean;
  isFinalItem?: boolean;
  isWand?: boolean;
  shootCooldown?: number;
  uid?: string;
  behavior?: {
    dialogue?: string;
    targetMap?: string;
    targetX?: number;
    targetY?: number;
    [k: string]: unknown;
  };
}

export interface PlayerStats {
  str: number;
  int: number;
  con: number;
  dex: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  xpToNext: number;
  statPoints: number;
}

export interface MapInstance {
  map: TileMap;
  entities: Entity[];
}

export interface GameState {
  maps: Record<string, MapInstance>;
  currentMapId: string;
  player: Entity;
  inventory: Entity[];
  equipped: Partial<Record<EquipSlot, Entity>>;
  stats: PlayerStats;
  gold: number;
  messages: string[];
  inventoryOpen: boolean;
  dead: boolean;
  playerName: string;
  mapMode: boolean;
  started: boolean;
  debugOpen: boolean;
  mainMenuOpen: boolean;
  shopOpen: boolean;
  activeShopId: string | null;
  mapModeReturnId: string | null;
  helpOpen: boolean;
  mapPreviewMeta: { size: string; diff: string; mapId: string } | null;
  projectiles: Projectile[];
  killCounts: Record<string, number>;
  totalDamageTaken: number;
  secretsFound: number;
  won: boolean;
  startTime: number;
}

export function currentMap(s: GameState): TileMap {
  return s.maps[s.currentMapId].map;
}

export function currentEntities(s: GameState): Entity[] {
  return s.maps[s.currentMapId].entities;
}
