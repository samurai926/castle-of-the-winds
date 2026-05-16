import { SpriteSheet } from "./SpriteSheet";
import { GameState, Entity, currentMap, currentEntities } from "../model/GameState";

/**
 * Renders the tile map and entities onto the canvas.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private spriteSheet: SpriteSheet;
  readonly viewportTilesX: number;
  readonly viewportTilesY: number;
  readonly tileSize: number;

  constructor(
    canvas: HTMLCanvasElement,
    spriteSheet: SpriteSheet,
    viewportTilesX = 15,
    viewportTilesY = 15,
    tileSize = 32
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;
    this.spriteSheet = spriteSheet;
    this.viewportTilesX = viewportTilesX;
    this.viewportTilesY = viewportTilesY;
    this.tileSize = tileSize;

    canvas.width = viewportTilesX * tileSize;
    canvas.height = viewportTilesY * tileSize;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: GameState): void {
    if (!this.spriteSheet.isLoaded()) return;
    if (state.mapMode) { this.renderMapOverview(state); return; }

    const ts = this.tileSize;
    const map = currentMap(state);
    const entities = currentEntities(state);

    const camX = Math.floor(state.player.x - Math.floor(this.viewportTilesX / 2));
    const camY = Math.floor(state.player.y - Math.floor(this.viewportTilesY / 2));

    // Clear to black (out-of-bounds + unseen tiles default to black)
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.viewportTilesX * ts, this.viewportTilesY * ts);

    // Draw map tiles (only seen ones)
    for (let vy = 0; vy < this.viewportTilesY; vy++) {
      for (let vx = 0; vx < this.viewportTilesX; vx++) {
        const mapX = camX + vx;
        const mapY = camY + vy;

        if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) {
          continue; // black
        }

        if (map.fogOfWar && !map.isSeen(mapX, mapY)) continue; // unseen → black

        const def = map.getTileDef(mapX, mapY);
        if (def) {
          this.spriteSheet.draw(this.ctx, def.sprite, vx * ts, vy * ts, ts);
        }
      }
    }

    // Pass 1: non-building entities
    for (const entity of entities) {
      if (entity.type === "building") continue;
      if (map.fogOfWar && !map.isSeen(entity.x, entity.y)) continue;
      const screenX = (entity.x - camX) * ts;
      const screenY = (entity.y - camY) * ts;
      if (
        screenX >= -ts && screenX < this.viewportTilesX * ts &&
        screenY >= -ts && screenY < this.viewportTilesY * ts
      ) {
        this.spriteSheet.draw(this.ctx, entity.sprite, screenX, screenY, ts);
      }
    }

    // Pass 2: building entities drawn on top, hidden when player inside
    for (const entity of entities) {
      if (entity.type !== "building") continue;
      if (entity.hideWhenPlayerIn) {
        const b = entity.hideWhenPlayerIn;
        if (
          state.player.x >= b.x && state.player.x < b.x + b.w &&
          state.player.y >= b.y && state.player.y < b.y + b.h
        ) continue;
      }
      const screenX = (entity.x - camX) * ts;
      const screenY = (entity.y - camY) * ts;
      const drawW = (entity.tileW ?? 1) * ts;
      const drawH = (entity.tileH ?? 1) * ts;
      if (
        screenX + drawW >= 0 && screenX < this.viewportTilesX * ts &&
        screenY + drawH >= 0 && screenY < this.viewportTilesY * ts
      ) {
        this.spriteSheet.draw(this.ctx, entity.sprite, screenX, screenY, drawW, drawH);
      }
    }

    // Draw player (always visible — it's where vision originates)
    const px = (state.player.x - camX) * ts;
    const py = (state.player.y - camY) * ts;
    this.spriteSheet.draw(this.ctx, state.player.sprite, px, py, ts);

    // Draw projectiles
    for (const proj of state.projectiles) {
      const sx = (proj.x - camX) * ts + ts / 2;
      const sy = (proj.y - camY) * ts + ts / 2;
      const r = Math.max(3, Math.floor(ts / 6));
      // Glow
      this.ctx.fillStyle = "rgba(180, 80, 255, 0.25)";
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      // Core
      this.ctx.fillStyle = "#cc44ff";
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, r, 0, Math.PI * 2);
      this.ctx.fill();
      // Bright centre
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, Math.max(1, r - 2), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderMapOverview(state: GameState): void {
    const map = currentMap(state);
    const entities = currentEntities(state);
    const cw = this.viewportTilesX * this.tileSize;
    const ch = this.viewportTilesY * this.tileSize;
    const ts = Math.max(2, Math.floor(Math.min(cw / map.width, ch / map.height)));
    const ox = Math.floor((cw - map.width * ts) / 2);
    const oy = Math.floor((ch - map.height * ts) / 2);
    const ctx = this.ctx;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.fogOfWar && !map.isSeen(x, y)) continue;
        const def = map.getTileDef(x, y);
        if (!def) continue;
        this.spriteSheet.draw(ctx, def.sprite, ox + x * ts, oy + y * ts, ts);
      }
    }

    const pd = Math.max(2, ts);

    // Portal markers — only on seen tiles
    for (const e of entities) {
      if (e.type !== "portal") continue;
      if (map.fogOfWar && !map.isSeen(e.x, e.y)) continue;
      const isDown = (e.name ?? "").toLowerCase().includes("down") || (e.name ?? "").toLowerCase().includes("stairs d");
      ctx.fillStyle = isDown ? "#ff6600" : "#00ccff";
      ctx.fillRect(ox + e.x * ts, oy + e.y * ts, pd, pd);
      // Label
      if (ts >= 3) {
        ctx.fillStyle = isDown ? "#ff6600" : "#00ccff";
        ctx.font = `bold 9px 'MS Sans Serif', Arial, sans-serif`;
        const label = isDown ? "↓" : "↑";
        ctx.fillText(label, ox + e.x * ts + pd + 1, oy + e.y * ts + pd);
      }
    }

    // Player dot (drawn last so always visible)
    ctx.fillStyle = "#00ff44";
    ctx.fillRect(ox + state.player.x * ts, oy + state.player.y * ts, pd, pd);

    // Legend
    ctx.font = "bold 11px 'MS Sans Serif', Arial, sans-serif";
    ctx.fillStyle = "#fff";    ctx.fillText("[any key] close", 4, 12);
    ctx.fillStyle = "#00ff44"; ctx.fillRect(4, 18, 6, 6);
    ctx.fillStyle = "#fff";    ctx.fillText("you", 13, 24);
    ctx.fillStyle = "#00ccff"; ctx.fillRect(4, 28, 6, 6);
    ctx.fillStyle = "#fff";    ctx.fillText("exit/up", 13, 34);
    ctx.fillStyle = "#ff6600"; ctx.fillRect(4, 38, 6, 6);
    ctx.fillStyle = "#fff";    ctx.fillText("stairs down", 13, 44);

    // Debug preview stats panel — top right
    if (state.mapModeReturnId) {
      const enemies  = entities.filter(e => e.type === "enemy" && !e.name?.includes("[BOSS]"));
      const boss     = entities.find(e  => e.type === "enemy" &&  e.name?.includes("[BOSS]"));
      const items    = entities.filter(e => e.type === "item");
      const treasure = entities.filter(e => e.type === "treasure");
      const meta     = state.mapPreviewMeta;

      const lines: { text: string; color: string }[] = [];
      if (meta) {
        lines.push({ text: `${meta.mapId}`, color: "#ffffff" });
        lines.push({ text: `${meta.size}  ·  ${meta.diff}`, color: "#aaaacc" });
      }
      lines.push({ text: "────────────────────", color: "#334" });

      // Enemies grouped
      const counts = new Map<string, { n: number; e: Entity }>();
      for (const e of enemies) {
        const k = e.name ?? "?";
        if (!counts.has(k)) counts.set(k, { n: 0, e });
        counts.get(k)!.n++;
      }
      if (counts.size === 0) {
        lines.push({ text: "Enemies: none", color: "#888899" });
      } else {
        lines.push({ text: `Enemies (${enemies.length})`, color: "#ffdd88" });
        for (const [name, { n, e }] of counts) {
          lines.push({ text: `  ${name} ×${n}  hp:${e.maxHp ?? e.hp} atk:${e.atk} def:${e.def ?? 0}`, color: "#ccccdd" });
        }
      }

      lines.push({ text: "────────────────────", color: "#334" });
      if (boss) {
        const bName = boss.name?.replace(" [BOSS]", "") ?? "Boss";
        lines.push({ text: `☠ ${bName}`, color: "#ff6666" });
        lines.push({ text: `  hp:${boss.maxHp ?? boss.hp}  atk:${boss.atk}  def:${boss.def ?? 0}`, color: "#ffaaaa" });
      } else {
        lines.push({ text: "Boss: not found", color: "#888899" });
      }

      lines.push({ text: "────────────────────", color: "#334" });
      lines.push({ text: `Items: ${items.length}   Treasure: ${treasure.length}`, color: "#aaaacc" });
      lines.push({ text: "press any key to close", color: "#556" });

      const fontSize = 10;
      const lineH   = 14;
      const padX    = 8, padY = 6;
      const panelW  = 210;
      const panelH  = lines.length * lineH + padY * 2;
      const panelX  = cw - panelW - 6;
      const panelY  = 6;

      ctx.fillStyle = "rgba(0,0,16,0.85)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "#334466";
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

      ctx.font = `${fontSize}px 'MS Sans Serif', monospace`;
      ctx.textBaseline = "top";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillStyle = lines[i].color;
        ctx.fillText(lines[i].text, panelX + padX, panelY + padY + i * lineH);
      }
    }
  }
}
