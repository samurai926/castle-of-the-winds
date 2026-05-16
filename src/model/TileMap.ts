/** Tile definition: maps a tile ID to a named sprite and properties */
export interface TileDef {
  sprite: string;
  solid: boolean;
  /** Tile blocks line of sight (defaults to solid). */
  opaque?: boolean;
  label?: string;
}

/**
 * A 2D tile map backed by a grid of integer tile IDs.
 * Each ID maps to a TileDef for rendering and collision.
 */
export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly grid: number[][];
  readonly tileDefs: Map<number, TileDef>;
  readonly fogOfWar: boolean;
  readonly seen: boolean[][];
  readonly visible: boolean[][];

  constructor(grid: number[][], tileDefs: Map<number, TileDef>, fogOfWar = false) {
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0]?.length ?? 0;
    this.tileDefs = tileDefs;
    this.fogOfWar = fogOfWar;
    this.seen = Array.from({ length: this.height }, () =>
      new Array(this.width).fill(!fogOfWar)
    );
    this.visible = Array.from({ length: this.height }, () =>
      new Array(this.width).fill(!fogOfWar)
    );
  }

  getTile(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -1;
    return this.grid[y][x];
  }

  getTileDef(x: number, y: number): TileDef | undefined {
    const id = this.getTile(x, y);
    return this.tileDefs.get(id);
  }

  isSolid(x: number, y: number): boolean {
    const def = this.getTileDef(x, y);
    return def?.solid ?? true;
  }

  isOpaque(x: number, y: number): boolean {
    const def = this.getTileDef(x, y);
    if (!def) return true;
    return def.opaque ?? def.solid;
  }

  isSeen(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.seen[y][x];
  }

  markSeen(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.seen[y][x] = true;
    this.visible[y][x] = true;
  }

  revealAll(): void {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        this.seen[y][x] = true;
        this.visible[y][x] = true;
      }
  }

  resetVisible(): void {
    if (!this.fogOfWar) return; // non-fog maps stay fully visible
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.visible[y][x] = false;
      }
    }
  }

  isVisible(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.visible[y][x];
  }
}
