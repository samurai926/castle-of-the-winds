/**
 * A sprite definition: a named region within the atlas image.
 */
export interface SpriteDef {
  /** Source X in the atlas (pixels) */
  sx: number;
  /** Source Y in the atlas (pixels) */
  sy: number;
  /** Source width (pixels) */
  sw: number;
  /** Source height (pixels) */
  sh: number;
}

/**
 * Loads a sprite atlas and draws individual sprites by name.
 * Unlike a uniform grid atlas, each sprite has explicit pixel coordinates.
 */
export class SpriteSheet {
  private image: HTMLImageElement;
  private ready = false;
  private sprites: Map<string, SpriteDef>;

  constructor(src: string, sprites: Record<string, SpriteDef>) {
    this.sprites = new Map(Object.entries(sprites));
    this.image = new Image();
    this.image.src = src;
    this.image.onload = () => {
      this.ready = true;
    };
  }

  isLoaded(): boolean {
    return this.ready;
  }

  /**
   * Draw a named sprite at the given canvas position.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    destX: number,
    destY: number,
    destW: number,
    destH?: number
  ): void {
    if (!this.ready) return;
    const dH = destH ?? destW;

    const def = this.sprites.get(spriteName);
    if (!def) {
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(destX, destY, destW, dH);
      return;
    }

    ctx.drawImage(
      this.image,
      def.sx, def.sy, def.sw, def.sh,
      destX, destY, destW, dH
    );
  }
}
