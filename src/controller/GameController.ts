import {
  GameState,
  Entity,
  Projectile,
  EquipSlot,
  currentMap,
  currentEntities,
} from "../model/GameState";
import { TileMap } from "../model/TileMap";
import { InputHandler } from "./InputHandler";
import { Renderer } from "../view/Renderer";
import { computeFOV } from "../model/fov";
import { SHOPS, ShopItem } from "../data/shopData";
import { generateDungeon, findSpawn, DungeonSize, DungeonDifficulty, FINAL_LEVEL } from "../data/dungeonGenerator";

const SLOTS: EquipSlot[] = ["weapon", "shield", "armor", "head"];
const FOV_RADIUS = 6;

const MAP_SPAWNS: Record<string, { x: number; y: number }> = {
  town: { x: 9, y: 15 },
};

const SHOP_TITLES: Record<string, string> = {
  blacksmith: "Blacksmith — Hrolf's Forge",
  merchant:   "Merchant — Lyra's Wares",
};

export class GameController {
  private state: GameState;
  private input: InputHandler;
  private renderer: Renderer;
  private messageLog: HTMLElement;
  private inventoryList: HTMLElement;
  private inventoryModal: HTMLElement;
  private modalBag: HTMLElement;
  private modalEquipped: HTMLElement;
  private dungeonCount = 0;
  private dungeonSize: DungeonSize = "small";
  private dungeonDiff: DungeonDifficulty = "easy";
  private dungeonMeta: Record<string, { size: DungeonSize; diff: DungeonDifficulty }> = {};
  private killMode = false;
  private spawnMode = false;
  private fireMode = false;
  private levelUpOpen = false;

  private readonly SPAWN_CATALOG: Record<string, Partial<Entity> & { sprite: string; name: string; hp: number; atk: number }> = {
    "Scorpion":      { sprite:"scorpion", name:"Scorpion",              hp:5,  maxHp:5,  atk:1, def:0, xpReward:12  },
    "Goblin":        { sprite:"orc",      name:"Goblin",                hp:6,  maxHp:6,  atk:2, def:0, xpReward:15  },
    "Orc":           { sprite:"orc",      name:"Orc",                   hp:10, maxHp:10, atk:3, def:1, xpReward:30  },
    "Skeleton":      { sprite:"skeleton", name:"Skeleton",              hp:8,  maxHp:8,  atk:2, def:1, xpReward:28  },
    "Cyclops":       { sprite:"cyclops",  name:"Cyclops",               hp:14, maxHp:14, atk:4, def:2, xpReward:45  },
    "Dark Mage":     { sprite:"villager", name:"Dark Mage",             hp:14, maxHp:14, atk:0, def:1, xpReward:60,  rangedAtk:9  },
    "Demon":         { sprite:"demon",    name:"Demon",                 hp:20, maxHp:20, atk:5, def:2, xpReward:80  },
    "Gargoyle":      { sprite:"sphinx",   name:"Gargoyle",              hp:12, maxHp:12, atk:4, def:2, xpReward:60  },
    "Void Mage":     { sprite:"villager", name:"Void Mage",             hp:20, maxHp:20, atk:0, def:2, xpReward:100, rangedAtk:15 },
    "Cave Troll":    { sprite:"cyclops",  name:"Cave Troll [BOSS]",     hp:30,  maxHp:30,  atk:4,  def:2, xpReward:120  },
    "Dungeon Lord":  { sprite:"demon",    name:"Dungeon Lord [BOSS]",   hp:55,  maxHp:55,  atk:6,  def:4, xpReward:300  },
    "Void Archdemon":{ sprite:"sphinx",   name:"Void Archdemon [BOSS]", hp:90,  maxHp:90,  atk:9,  def:6, xpReward:600  },
    "The Archmage":  { sprite:"sphinx",   name:"The Archmage [BOSS]",   hp:150, maxHp:150, atk:12, def:8, xpReward:2000 },
  };
  private levelUpBaseStats: { str: number; int: number; con: number; dex: number; statPoints: number } | null = null;
  private canvas: HTMLCanvasElement;

  constructor(state: GameState, input: InputHandler, renderer: Renderer) {
    this.state = state;
    this.input = input;
    this.renderer = renderer;
    this.messageLog = document.getElementById("message-log")!;
    this.inventoryList = document.getElementById("inventory-list")!;
    this.inventoryModal = document.getElementById("inventory-modal")!;
    this.modalBag = document.getElementById("modal-bag")!;
    this.modalEquipped = document.getElementById("modal-equipped")!;
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

    window.addEventListener("keydown", (e) => this.onKey(e));
    this.canvas.addEventListener("click", (e) => this.onCanvasClick(e));
    this.canvas.addEventListener("contextmenu", (e) => this.onCanvasRightClick(e));
    document.getElementById("modal-close")?.addEventListener("click", () => this.closeInventory());
    document.getElementById("shop-close")?.addEventListener("click", () => this.closeShop());

    // Start screen right-click lore
    document.getElementById("start-screen")?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const lore = [
        "Three expeditions entered the caves. One returned. It didn't speak of the others.",
        "The archmage's library was found empty. The books had walked themselves out.",
        "Workers who carved the deepest chambers refused to return to the surface. Their tools were found arranged in a perfect circle.",
        "The winds that howl through the lower halls smell faintly of burnt parchment and old regret.",
        "The name 'Castle of the Winds' was given by survivors. No one agrees on what it was called before, or in what language.",
        "The stones in the lowest chambers are warm to the touch. No geologist has offered an explanation.",
        "A merchant once claimed to have sold candles to a figure deep in the caves. The coins he received dissolved by dawn.",
        "Local legend says the castle predates the town by four centuries. Local legend says this quietly, and only once.",
        "The dungeon redraws itself between visits. Cartographers have stopped trying.",
        "Guards stationed at the cave entrance are rotated weekly. Those who stay longer stop blinking as much.",
        "Items left in the dungeon overnight are sometimes moved. Never taken. Just moved.",
        "The boss on the final level has a name. No one who learned it came back to share it.",
      ];
      const loreEl = document.getElementById("start-lore");
      if (loreEl) loreEl.textContent = lore[Math.floor(Math.random() * lore.length)];
    });

    // Start screen
    document.getElementById("start-play")?.addEventListener("click", () => {
      const inp = document.getElementById("start-name-input") as HTMLInputElement;
      this.state.playerName = inp?.value.trim() || "Adventurer";
      document.getElementById("start-screen")!.style.display = "none";
      this.state.started = true;
    });

    // Menu bar
    document.getElementById("btn-main-menu")?.addEventListener("click", () => this.openMainMenu());
    document.getElementById("btn-inventory")?.addEventListener("click", () => this.toggleInventory());
    document.getElementById("btn-map")?.addEventListener("click", () => this.toggleMap());
    document.getElementById("btn-debug")?.addEventListener("click", () => this.openDebugMenu());

    // Main menu
    document.getElementById("mm-resume")?.addEventListener("click", () => this.closeMainMenu());
    document.getElementById("mm-rest")?.addEventListener("click", () => this.rest());
    document.getElementById("mm-restart")?.addEventListener("click", () => {
      sessionStorage.setItem("autostart", this.state.playerName);
      location.reload();
    });
    document.getElementById("mm-quit")?.addEventListener("click", () => location.reload());

    // Debug
    document.getElementById("dbg-jump-btn")?.addEventListener("click", () => this.debugJump());
    document.getElementById("dbg-kill-btn")?.addEventListener("click", () => this.debugKill());
    document.getElementById("dbg-killplayer-btn")?.addEventListener("click", () => this.debugKillPlayer());
    document.getElementById("dbg-gold-btn")?.addEventListener("click", () => this.debugAddGold());
    document.getElementById("dbg-items-btn")?.addEventListener("click", () => this.debugAddAllItems());
    document.getElementById("dbg-levelup-btn")?.addEventListener("click", () => this.debugLevelUp());
    document.getElementById("dbg-gen-btn")?.addEventListener("click", () => this.debugGenDungeon());
    document.getElementById("dbg-preview-btn")?.addEventListener("click", () => this.debugPreviewDungeon());
    document.getElementById("dbg-spawn-btn")?.addEventListener("click", () => this.debugEnterSpawnMode());
    document.getElementById("dbg-goto-final-btn")?.addEventListener("click", () => this.debugGotoFinal());
    document.getElementById("dbg-win-btn")?.addEventListener("click", () => this.debugWinGame());
    document.getElementById("dbg-close")?.addEventListener("click", () => this.closeDebugMenu());

    // Level-up modal
    document.getElementById("lu-str-btn")?.addEventListener("click", () => this.assignStatPoint("str"));
    document.getElementById("lu-int-btn")?.addEventListener("click", () => this.assignStatPoint("int"));
    document.getElementById("lu-con-btn")?.addEventListener("click", () => this.assignStatPoint("con"));
    document.getElementById("lu-dex-btn")?.addEventListener("click", () => this.assignStatPoint("dex"));
    document.getElementById("lu-ok-btn")?.addEventListener("click", () => this.closeLevelUpModal());
    document.getElementById("lu-reset-btn")?.addEventListener("click", () => this.resetLevelUpStats());

    // Help modal
    document.getElementById("btn-help")?.addEventListener("click", () => this.toggleHelp());
    document.getElementById("help-close")?.addEventListener("click", () => this.closeHelp());
    document.getElementById("help-ok")?.addEventListener("click", () => this.closeHelp());

    // Right-click stat descriptions — level-up modal
    document.getElementById("levelup-modal")?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const row = (e.target as HTMLElement).closest(".win-row") as HTMLElement | null;
      if (!row) return;
      const label = row.querySelector("label")?.textContent?.trim() ?? "";
      const desc = this.statDescription(label);
      if (desc) this.addMessage(desc);
    });

    // Right-click stat descriptions — sidebar stats panel
    document.querySelector("#sidebar-normal .panel")?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const row = (e.target as HTMLElement).closest(".stat-row") as HTMLElement | null;
      if (!row) return;
      const label = (row.querySelector("span") as HTMLElement | null)?.textContent?.trim() ?? "";
      const desc = this.statDescription(label);
      if (desc) this.addMessage(desc);
    });
  }

  start(): void {
    this.state.startTime = Date.now();
    this.addMessage("WASD/arrows = move. I = inventory. M = map. ? = Help.");
    this.addMessage("Walk onto items to pick up. Right-click anything to examine it.");
    this.addMessage("Equip a weapon, then bump enemies to attack.");
    this.addMessage("Visit the Blacksmith and Merchant in the east wing.");
    this.updateStatsUI();
    this.updateInventoryUI();
    this.refreshFOV();
    // Projectiles advance on a real-time tick independent of player turns
    setInterval(() => {
      if (this.state.started && !this.state.dead && !this.anyModalOpen()) {
        this.moveProjectiles();
        this.wizardsFire();
      }
    }, 750);
    // Timer display — update every second
    setInterval(() => {
      if (this.state.started && !this.state.dead && !this.state.won) {
        const el = document.getElementById("stat-time");
        if (el) el.textContent = this.formatTime(Date.now() - this.state.startTime);
      }
    }, 1000);
    this.loop();
  }

  private loop = (): void => {
    this.update();
    this.renderer.render(this.state);
    requestAnimationFrame(this.loop);
  };

  private anyModalOpen(): boolean {
    return (
      this.state.inventoryOpen ||
      this.state.debugOpen ||
      this.state.mainMenuOpen ||
      this.state.mapMode ||
      this.state.shopOpen ||
      this.levelUpOpen ||
      this.state.helpOpen ||
      this.state.won
    );
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.state.started) return;

    // Any key closes map / debug preview
    if (this.state.mapMode) {
      e.preventDefault();
      this.toggleMap();
      this.input.consumeMove();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      if (this.killMode) {
        this.killMode = false;
        this.canvas.style.cursor = "";
        this.addMessage("[DEBUG] Kill mode cancelled.");
        return;
      }
      if (this.spawnMode) {
        this.spawnMode = false;
        this.canvas.style.cursor = "";
        this.addMessage("[DEBUG] Spawn mode cancelled.");
        return;
      }
      if (this.fireMode) {
        this.fireMode = false;
        this.canvas.style.cursor = "";
        this.addMessage("Fire cancelled.");
        return;
      }
      if (this.state.inventoryOpen) { this.closeInventory(); return; }
      if (this.state.shopOpen)      { this.closeShop();      return; }
      if (this.state.debugOpen)     { this.closeDebugMenu(); return; }
      if (this.state.mapMode)       { this.toggleMap();      return; }
      if (this.state.mainMenuOpen)  { this.closeMainMenu();  return; }
      this.openMainMenu();
      return;
    }
    if (e.key === "i" || e.key === "I") {
      e.preventDefault();
      if (!this.state.mainMenuOpen && !this.state.debugOpen && !this.state.shopOpen)
        this.toggleInventory();
      return;
    }
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      if (!this.state.inventoryOpen && !this.state.debugOpen && !this.state.mainMenuOpen && !this.state.shopOpen)
        this.toggleMap();
      return;
    }
    if (e.key === "`" || e.key === "~") {
      e.preventDefault();
      if (!this.state.inventoryOpen && !this.state.mainMenuOpen && !this.state.shopOpen) {
        if (this.state.debugOpen) this.closeDebugMenu();
        else this.openDebugMenu();
      }
      return;
    }
    if (e.key === "?" || e.key === "/") {
      e.preventDefault();
      this.toggleHelp();
      return;
    }
    if ((e.key === "f" || e.key === "F") && !this.anyModalOpen()) {
      e.preventDefault();
      if (this.fireMode) {
        this.fireMode = false;
        this.canvas.style.cursor = "";
        this.addMessage("Fire cancelled.");
      } else if (this.state.equipped.weapon?.isWand) {
        this.fireMode = true;
        this.canvas.style.cursor = "crosshair";
        this.addMessage("Fire bolt — click target or use WASD/QEZC. F or ESC to cancel.");
      } else {
        this.addMessage("No wand equipped.");
      }
      return;
    }
  }

  // ── Map overview ─────────────────────────────────────────────────

  private toggleMap(): void {
    if (this.state.mapMode) {
      if (this.state.mapModeReturnId) {
        this.state.currentMapId = this.state.mapModeReturnId;
        this.state.mapModeReturnId = null;
        delete this.state.maps["dungeon_preview"];
      }
      this.state.mapMode = false;
      this.state.mapPreviewMeta = null;
      this.setSidebarMapMode(false);
    } else {
      this.state.mapMode = true;
      this.setSidebarMapMode(true);
      this.populateMapInfo();
    }
    const btn = document.getElementById("btn-map");
    if (btn) { btn.style.background = this.state.mapMode ? "#000080" : ""; }
    if (btn) { btn.style.color = this.state.mapMode ? "#fff" : ""; }
  }

  private setSidebarMapMode(mapOn: boolean): void {
    const norm = document.getElementById("sidebar-normal");
    const info = document.getElementById("map-info-panel");
    if (norm) norm.style.display = mapOn ? "none" : "flex";
    if (info) info.style.display = mapOn ? "flex" : "none";
  }

  private populateMapInfo(): void {
    const mapId = this.state.currentMapId;
    const entities = currentEntities(this.state);
    // For debug preview, show info about the real map, not "dungeon_preview"
    const realMapId = this.state.mapModeReturnId ?? mapId;
    const meta = this.dungeonMeta[realMapId];

    const metaEl = document.getElementById("map-info-meta");
    if (metaEl) {
      let h = `<h3>${realMapId}</h3>`;
      if (meta) {
        h += `<div class="stat-row"><span>Size</span><span>${meta.size}</span></div>`;
        h += `<div class="stat-row"><span>Diff</span><span>${meta.diff}</span></div>`;
      }
      const boss = entities.find(e => e.type === "enemy" && e.name?.includes("[BOSS]"));
      if (boss) {
        const bName = boss.name?.replace(" [BOSS]", "") ?? "Boss";
        h += `<div style="font-size:10px;color:#c04040;margin-top:4px;font-weight:bold;">☠ ${bName}</div>`;
        h += `<div style="font-size:10px;color:#808080;">hp:${boss.hp}/${boss.maxHp} atk:${boss.atk} def:${boss.def ?? 0}</div>`;
      }
      if (!this.state.mapModeReturnId) {
        h += `<div style="font-size:10px;color:#808080;margin-top:3px;">Click map to warp</div>`;
      }
      metaEl.innerHTML = h;
    }

    const enemyEl = document.getElementById("map-info-enemies");
    if (enemyEl) {
      const enemies = entities.filter(e => e.type === "enemy");
      if (enemies.length === 0) {
        enemyEl.innerHTML = `<span style="color:#808080;">None</span>`;
      } else {
        enemyEl.innerHTML = enemies.map(e =>
          `<div style="margin-bottom:3px;"><b>${e.name ?? "?"}</b> <span style="color:#808080;">(${e.x},${e.y})</span><br>` +
          `<span style="color:#606060;">HP:${e.hp}/${e.maxHp} &nbsp;ATK:${e.atk ?? 0} &nbsp;DEF:${e.def ?? 0}</span></div>`
        ).join("");
      }
    }

    const lootEl = document.getElementById("map-info-loot");
    if (lootEl) {
      const loot = entities.filter(e => e.type === "item" || e.type === "treasure");
      if (loot.length === 0) {
        lootEl.innerHTML = `<span style="color:#808080;">None</span>`;
      } else {
        lootEl.innerHTML = loot.map(l => {
          let desc = l.name ?? l.sprite;
          if (l.gold) desc += ` — ${l.gold}g`;
          if (l.atk) desc += ` (atk:${l.atk})`;
          if (l.def) desc += ` (def:${l.def})`;
          if (l.healAmt) desc += ` (+${l.healAmt}HP)`;
          return `<div style="margin-bottom:2px;">${desc} <span style="color:#808080;">(${l.x},${l.y})</span></div>`;
        }).join("");
      }
    }
  }

  // ── Main menu ────────────────────────────────────────────────────

  private openMainMenu(): void {
    this.state.mainMenuOpen = true;
    document.getElementById("mainmenu-modal")!.style.display = "flex";
  }

  private closeMainMenu(): void {
    this.state.mainMenuOpen = false;
    document.getElementById("mainmenu-modal")!.style.display = "none";
  }

  // ── Debug ─────────────────────────────────────────────────────────

  private openDebugMenu(): void {
    this.state.debugOpen = true;
    const levelSel = document.getElementById("dbg-level-select") as HTMLSelectElement;
    levelSel.innerHTML = "";
    for (const mapId of Object.keys(this.state.maps)) {
      const opt = document.createElement("option");
      opt.value = mapId;
      opt.textContent = mapId;
      if (mapId === this.state.currentMapId) opt.selected = true;
      levelSel.appendChild(opt);
    }
    document.getElementById("debug-modal")!.style.display = "flex";
  }

  private closeDebugMenu(): void {
    this.state.debugOpen = false;
    document.getElementById("debug-modal")!.style.display = "none";
  }

  private rest(): void {
    if (this.state.currentMapId !== "town") {
      this.addMessage("Cannot rest here — too dangerous.");
      this.closeMainMenu();
      return;
    }
    const s = this.state.stats;
    this.state.player.hp = s.maxHp;
    s.hp = s.maxHp;
    s.mp = s.maxMp;
    this.addMessage("You rest. HP and MP fully restored.");
    this.updateStatsUI();
    this.closeMainMenu();
  }

  private debugAddGold(): void {
    this.state.gold += 100;
    this.updateStatsUI();
    this.addMessage("[DEBUG] +100 gold.");
  }

  private debugGenDungeon(): void {
    this.dungeonSize = (document.getElementById("dbg-dung-size") as HTMLSelectElement).value as DungeonSize;
    this.dungeonDiff = (document.getElementById("dbg-dung-diff") as HTMLSelectElement).value as DungeonDifficulty;
    this.dungeonCount++;
    const mapId = `dungeon_${this.dungeonCount}`;
    const nextId = this.dungeonCount >= FINAL_LEVEL ? null : `dungeon_${this.dungeonCount + 1}`;
    const inst = generateDungeon(this.dungeonSize, this.dungeonDiff, this.dungeonCount, "town", 9, 15, nextId);
    this.state.maps[mapId] = inst;
    this.dungeonMeta[mapId] = { size: this.dungeonSize, diff: this.dungeonDiff };
    this.openDebugMenu();
    this.addMessage(`[DEBUG] Generated ${mapId} (${this.dungeonSize}/${this.dungeonDiff}). Use jump-to-level to enter.`);
  }

  private debugPreviewDungeon(): void {
    this.closeDebugMenu();
    const realMapId = this.state.currentMapId;
    const realInst = this.state.maps[realMapId];
    const previewMap = new TileMap(realInst.map.grid, realInst.map.tileDefs, false);
    this.state.maps["dungeon_preview"] = { map: previewMap, entities: realInst.entities };
    this.state.mapModeReturnId = realMapId;
    this.state.currentMapId = "dungeon_preview";
    const meta = this.dungeonMeta[realMapId];
    this.state.mapPreviewMeta = meta
      ? { size: meta.size, diff: meta.diff, mapId: realMapId }
      : null;
    this.toggleMap();
    this.addMessage("[DEBUG] Full map revealed. Press any key to close.");
  }

  private debugAddAllItems(): void {
    for (const [shopId, stock] of Object.entries(SHOPS)) {
      for (const item of stock) {
        this.state.inventory.push({
          x: 0, y: 0, type: "item",
          name: item.name, sprite: item.sprite,
          slot: item.slot, atk: item.atk, def: item.def,
          healAmt: item.healAmt, boostStat: item.boostStat,
          boostAmt: item.boostAmt, price: item.price,
        });
      }
    }
    // Drop-only items not in any shop
    this.state.inventory.push({ x:0, y:0, type:"item", sprite:"magic_gem", name:"Wand of Bolts", slot:"weapon", isWand:true, price:150 });
    this.updateInventoryUI();
    this.addMessage(`[DEBUG] Added all items to inventory.`);
  }

  private debugJump(): void {
    const sel = document.getElementById("dbg-level-select") as HTMLSelectElement;
    const mapId = sel.value;
    if (!mapId || !this.state.maps[mapId]) return;
    this.state.currentMapId = mapId;
    this.state.projectiles = [];
    const inst = this.state.maps[mapId];
    const preferred = MAP_SPAWNS[mapId] ?? { x: 3, y: 3 };
    const spawn = findSpawn(inst.map, inst.entities, preferred.x, preferred.y);
    this.state.player.x = spawn.x;
    this.state.player.y = spawn.y;
    this.refreshFOV();
    this.updateStatsUI();
    this.addMessage(`[DEBUG] Jumped to ${mapId}.`);
    this.closeDebugMenu();
  }

  private debugKill(): void {
    this.closeDebugMenu();
    this.killMode = true;
    this.canvas.style.cursor = "crosshair";
    this.addMessage("[DEBUG] Click an enemy to kill it. ESC to cancel.");
  }

  private debugEnterSpawnMode(): void {
    this.closeDebugMenu();
    const sel = document.getElementById("dbg-spawn-select") as HTMLSelectElement;
    const key = sel?.value ?? "Goblin";
    this.spawnMode = true;
    this.canvas.style.cursor = "crosshair";
    this.addMessage(`[DEBUG] Click tile to spawn ${key}. ESC to cancel.`);
  }

  private debugLevelUp(): void {
    this.closeDebugMenu();
    const s = this.state.stats;
    this.grantXp(s.xpToNext - s.xp);
  }

  private debugKillPlayer(): void {
    this.closeDebugMenu();
    this.state.player.hp = 0;
    this.state.stats.hp = 0;
    this.state.dead = true;
    this.showGameOver("[DEBUG] command");
  }

  private debugWinGame(): void {
    this.closeDebugMenu();
    this.state.won = true;
    this.showVictory();
  }

  private debugGotoFinal(): void {
    const mapId = `dungeon_${FINAL_LEVEL}`;
    if (!this.state.maps[mapId]) {
      const prevId = this.state.currentMapId;
      const inst = generateDungeon("large", "ultra", FINAL_LEVEL, prevId, 3, 4, null);
      this.state.maps[mapId] = inst;
      this.dungeonMeta[mapId] = { size: "large", diff: "ultra" };
    }
    this.state.currentMapId = mapId;
    this.state.projectiles = [];
    const inst = this.state.maps[mapId];
    const spawn = findSpawn(inst.map, inst.entities, 3, 4);
    this.state.player.x = spawn.x;
    this.state.player.y = spawn.y;
    this.refreshFOV();
    this.updateStatsUI();
    this.addMessage(`[DEBUG] Jumped to final level (dungeon_${FINAL_LEVEL}).`);
    this.closeDebugMenu();
  }

  private onCanvasClick(e: MouseEvent): void {
    if (!this.state.started) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Map mode: click to warp (only for real maps, not debug preview)
    if (this.state.mapMode && !this.state.mapModeReturnId) {
      const map = currentMap(this.state);
      const cw = this.renderer.viewportTilesX * this.renderer.tileSize;
      const ch = this.renderer.viewportTilesY * this.renderer.tileSize;
      const ts = Math.max(2, Math.floor(Math.min(cw / map.width, ch / map.height)));
      const ox = Math.floor((cw - map.width * ts) / 2);
      const oy = Math.floor((ch - map.height * ts) / 2);
      const tileX = Math.floor((px - ox) / ts);
      const tileY = Math.floor((py - oy) / ts);
      if (tileX >= 0 && tileX < map.width && tileY >= 0 && tileY < map.height && !map.isSolid(tileX, tileY)) {
        this.state.player.x = tileX;
        this.state.player.y = tileY;
        this.addMessage(`Warped to (${tileX}, ${tileY}).`);
        this.toggleMap();
        this.refreshFOV();
      }
      return;
    }

    const ts = this.renderer.tileSize;
    const camX = Math.floor(this.state.player.x - Math.floor(this.renderer.viewportTilesX / 2));
    const camY = Math.floor(this.state.player.y - Math.floor(this.renderer.viewportTilesY / 2));
    const tileX = camX + Math.floor(px / ts);
    const tileY = camY + Math.floor(py / ts);

    // Fire mode: click to fire bolt toward clicked tile (8-directional)
    if (this.fireMode) {
      this.fireMode = false;
      this.canvas.style.cursor = "";
      const plx = this.state.player.x, ply = this.state.player.y;
      if (tileX === plx && tileY === ply) { this.addMessage("Fire cancelled."); return; }
      const s = this.state.stats;
      const mpCost = 4;
      if (s.mp < mpCost) { this.addMessage("Not enough mana to fire!"); return; }
      const dirX = Math.sign(tileX - plx);
      const dirY = Math.sign(tileY - ply);
      const fireX = plx + dirX, fireY = ply + dirY;
      const map = currentMap(this.state);
      if (map.isSolid(fireX, fireY)) { this.addMessage("The bolt fizzles into the wall."); return; }
      s.mp -= mpCost;
      const boltDmg = 3 + Math.floor(Math.max(0, s.int - 10));
      const entities = currentEntities(this.state);
      const adjIdx = entities.findIndex(en => en.x === fireX && en.y === fireY && en.type === "enemy");
      if (adjIdx !== -1) {
        this.applyWandHit(adjIdx, boltDmg);
        this.updateStatsUI();
        this.refreshFOV();
        this.moveEnemies();
        return;
      }
      this.state.projectiles.push({ x: fireX, y: fireY, dx: dirX, dy: dirY, damage: boltDmg, ownerId: "player", fromPlayer: true });
      this.addMessage(`You fire a bolt. (MP: ${s.mp}/${s.maxMp})`);
      this.updateStatsUI();
      this.moveEnemies();
      return;
    }

    // Kill mode: click to kill enemy in normal view
    if (this.killMode) {
      const entities = currentEntities(this.state);
      const idx = entities.findIndex(e2 => e2.type === "enemy" && e2.x === tileX && e2.y === tileY);
      if (idx !== -1) {
        this.addMessage(`[DEBUG] Killed ${entities[idx].name ?? "enemy"}.`);
        entities.splice(idx, 1);
      } else {
        this.addMessage("[DEBUG] No enemy there.");
      }
      this.killMode = false;
      this.canvas.style.cursor = "";
      return;
    }

    // Spawn mode: click tile to place selected enemy
    if (this.spawnMode) {
      const map = currentMap(this.state);
      if (map.isSolid(tileX, tileY)) {
        this.addMessage("[DEBUG] Can't spawn on solid tile.");
      } else {
        const sel = document.getElementById("dbg-spawn-select") as HTMLSelectElement;
        const key = sel?.value ?? "Goblin";
        const tmpl = this.SPAWN_CATALOG[key];
        if (tmpl) {
          const entities = currentEntities(this.state);
          const entity: Entity = {
            x: tileX, y: tileY,
            type: "enemy",
            sprite: tmpl.sprite,
            name: tmpl.name,
            hp: tmpl.hp,
            maxHp: tmpl.maxHp ?? tmpl.hp,
            atk: tmpl.atk,
            def: tmpl.def ?? 0,
            xpReward: tmpl.xpReward,
            aware: true,
            ...(tmpl.rangedAtk !== undefined ? { rangedAtk: tmpl.rangedAtk } : {}),
            loot: [{ x:0, y:0, type:"treasure", sprite:"gold", name:"Gold", gold: 10 }],
          };
          entities.push(entity);
          this.addMessage(`[DEBUG] Spawned ${tmpl.name} at (${tileX}, ${tileY}).`);
        }
      }
      this.spawnMode = false;
      this.canvas.style.cursor = "";
    }
  }

  private onCanvasRightClick(e: MouseEvent): void {
    e.preventDefault();
    if (!this.state.started || this.state.mapMode) return;

    const rect = this.canvas.getBoundingClientRect();
    const ts = this.renderer.tileSize;
    const camX = Math.floor(this.state.player.x - Math.floor(this.renderer.viewportTilesX / 2));
    const camY = Math.floor(this.state.player.y - Math.floor(this.renderer.viewportTilesY / 2));
    const tileX = camX + Math.floor((e.clientX - rect.left) / ts);
    const tileY = camY + Math.floor((e.clientY - rect.top) / ts);
    const map = currentMap(this.state);

    if (map.fogOfWar && !map.isSeen(tileX, tileY)) {
      this.addMessage("Nothing but darkness out there.");
      return;
    }

    if (tileX === this.state.player.x && tileY === this.state.player.y) {
      const quips = [
        `${this.state.playerName}. Looking good, adventurer.`,
        `${this.state.playerName}. Still breathing — that's something.`,
        `That's you. A hero, presumably.`,
        `${this.state.playerName}. Remarkably intact, all things considered.`,
        `You stare at yourself. Nothing stares back.`,
      ];
      this.addMessage(quips[Math.floor(Math.random() * quips.length)]);
      return;
    }

    const entities = currentEntities(this.state);
    const entity = entities.find(en => en.x === tileX && en.y === tileY && en.type !== "building");
    if (entity) {
      this.addMessage(this.describeEntity(entity));
      return;
    }

    const def = map.getTileDef(tileX, tileY);
    if (def?.label) {
      this.addMessage(`${def.label[0].toUpperCase()}${def.label.slice(1)}.`);
      return;
    }

    const vague = [
      "Nothing of note here.",
      "Just empty space.",
      "The air feels stale.",
      "You sense something faint. Probably nothing.",
      "An unremarkable corner of the world.",
    ];
    this.addMessage(vague[Math.floor(Math.random() * vague.length)]);
  }

  private describeEntity(entity: Entity): string {
    switch (entity.type) {
      case "enemy": {
        const hp = entity.hp ?? "?";
        const maxHp = entity.maxHp ?? "?";
        const def = entity.def ?? 0;
        if (entity.rangedAtk !== undefined) {
          return `${entity.name ?? "Wizard"} — HP: ${hp}/${maxHp}  BOLT: ${entity.rangedAtk}  DEF: ${def}  [ranged]`;
        }
        return `${entity.name ?? "Enemy"} — HP: ${hp}/${maxHp}  ATK: ${entity.atk ?? 0}  DEF: ${def}`;
      }
      case "npc": {
        const shopId = entity.behavior?.shopId as string | undefined;
        if (shopId) return `${entity.name ?? "NPC"} — ${SHOP_TITLES[shopId] ?? shopId}`;
        const prof = entity.behavior?.dialogue as string | undefined;
        return `${entity.name ?? "NPC"} — ${prof ?? "A local resident."}`;
      }
      case "item": {
        const parts: string[] = [entity.name ?? entity.sprite];
        if (entity.isWand)  parts.push(`bolt:${3 + Math.floor(Math.max(0, this.state.stats.int - 10))} (INT-scaled)  4 MP/shot  [weapon]`);
        else {
          if (entity.atk)     parts.push(`+${entity.atk} ATK`);
          if (entity.def)     parts.push(`+${entity.def} DEF`);
          if (entity.healAmt) parts.push(`+${entity.healAmt} HP`);
          if (entity.boostStat && entity.boostAmt) parts.push(`+${entity.boostAmt} ${entity.boostStat.toUpperCase()}`);
          if (entity.slot)    parts.push(`[${entity.slot}]`);
        }
        return parts.join("  ");
      }
      case "chest": {
        const n = entity.loot?.length ?? 0;
        return `${entity.name ?? "Chest"} — ${n > 0 ? `contains ${n} item${n !== 1 ? "s" : ""}` : "empty"}`;
      }
      case "treasure":
        return `${entity.name ?? "Treasure"} — worth ${entity.gold ?? 0} gold`;
      case "portal":
        return `${entity.name ?? "Portal"} — ${(entity.behavior?.targetMap as string | undefined) ?? "leads elsewhere"}`;
      case "door":
        return `${entity.name ?? "Door"} — ${entity.keyId ? "locked" : "passage"}`;
      default:
        return `${entity.name ?? "Something"} is here.`;
    }
  }

  // ── Shop ─────────────────────────────────────────────────────────

  private openShop(shopId: string): void {
    this.state.shopOpen = true;
    this.state.activeShopId = shopId;
    document.getElementById("shop-title")!.textContent = SHOP_TITLES[shopId] ?? shopId;
    this.renderShopModal();
    document.getElementById("shop-modal")!.style.display = "flex";
  }

  private closeShop(): void {
    this.state.shopOpen = false;
    this.state.activeShopId = null;
    document.getElementById("shop-modal")!.style.display = "none";
  }

  private itemDesc(item: ShopItem | Entity): string {
    const parts: string[] = [item.name ?? item.sprite];
    if (item.atk)      parts.push(`atk ${item.atk}`);
    if (item.def)      parts.push(`def ${item.def}`);
    if (item.healAmt)  parts.push(`+${item.healAmt} HP`);
    if (item.boostStat && item.boostAmt)
                       parts.push(`+${item.boostAmt} ${item.boostStat.toUpperCase()}`);
    if (item.slot)     parts.push(item.slot);
    return parts.length > 1 ? `${parts[0]} (${parts.slice(1).join(", ")})` : parts[0];
  }

  private renderShopModal(): void {
    const shopId = this.state.activeShopId!;
    const stock = SHOPS[shopId] ?? [];
    document.getElementById("shop-gold")!.textContent = String(this.state.gold);

    const stockEl = document.getElementById("shop-stock")!;
    stockEl.innerHTML = "";
    stock.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "bag-row";
      const nameEl = document.createElement("span");
      nameEl.style.flex = "1";
      nameEl.textContent = this.itemDesc(item);
      row.appendChild(nameEl);
      const priceEl = document.createElement("span");
      priceEl.style.marginRight = "6px";
      priceEl.textContent = `${item.price}g`;
      row.appendChild(priceEl);
      const btn = document.createElement("button");
      btn.textContent = "Buy";
      btn.disabled = this.state.gold < item.price;
      btn.onclick = () => this.buyItem(i);
      row.appendChild(btn);
      stockEl.appendChild(row);
    });

    const sellEl = document.getElementById("shop-sell")!;
    sellEl.innerHTML = "";
    const GEAR_SLOTS = new Set(["weapon","armor","shield","head"]);
    const isBlacksmith = shopId === "blacksmith";
    const sellable = this.state.inventory.filter(it => !isBlacksmith || (it.slot && GEAR_SLOTS.has(it.slot)));
    if (sellable.length === 0) {
      sellEl.textContent = isBlacksmith ? "(no gear to sell)" : "(nothing to sell)";
      return;
    }
    this.state.inventory.forEach((item, i) => {
      const isGear = item.slot && GEAR_SLOTS.has(item.slot);
      if (isBlacksmith && !isGear) return;
      const sellPrice = isBlacksmith
        ? (item.price ? Math.floor(item.price / 2) : 5)
        : (item.price ? Math.floor(item.price * (isGear ? 0.25 : 0.5)) : 5);
      const row = document.createElement("div");
      row.className = "bag-row";
      const nameEl = document.createElement("span");
      nameEl.style.flex = "1";
      nameEl.textContent = item.name ?? item.sprite;
      row.appendChild(nameEl);
      const priceEl = document.createElement("span");
      priceEl.style.marginRight = "6px";
      priceEl.textContent = `${sellPrice}g`;
      row.appendChild(priceEl);
      const btn = document.createElement("button");
      btn.textContent = "Sell";
      btn.onclick = () => this.sellItem(i);
      row.appendChild(btn);
      sellEl.appendChild(row);
    });
  }

  private buyItem(stockIdx: number): void {
    const shopId = this.state.activeShopId!;
    const item = SHOPS[shopId]?.[stockIdx];
    if (!item) return;
    if (this.state.gold < item.price) {
      this.addMessage("Not enough gold.");
      return;
    }
    this.state.gold -= item.price;
    const entity: Entity = {
      x: 0, y: 0, type: "item",
      name: item.name, sprite: item.sprite,
      slot: item.slot, atk: item.atk, def: item.def,
      healAmt: item.healAmt, boostStat: item.boostStat,
      boostAmt: item.boostAmt, price: item.price,
    };
    this.state.inventory.push(entity);
    this.addMessage(`Bought ${item.name} for ${item.price}g.`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderShopModal();
  }

  private sellItem(inventoryIdx: number): void {
    const item = this.state.inventory[inventoryIdx];
    if (!item) return;
    const shopId = this.state.activeShopId!;
    const isGear = item.slot && ["weapon","armor","shield","head"].includes(item.slot);
    if (shopId === "blacksmith" && !isGear) {
      this.addMessage("Blacksmith only buys weapons and armor.");
      return;
    }
    const sellPrice = shopId === "blacksmith"
      ? (item.price ? Math.floor(item.price / 2) : 5)
      : (item.price ? Math.floor(item.price * (isGear ? 0.25 : 0.5)) : 5);
    this.state.inventory.splice(inventoryIdx, 1);
    this.state.gold += sellPrice;
    this.addMessage(`Sold ${item.name ?? "item"} for ${sellPrice}g.`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderShopModal();
  }

  // ── Inventory ────────────────────────────────────────────────────

  private toggleInventory(): void {
    if (this.state.inventoryOpen) this.closeInventory();
    else this.openInventory();
  }

  private openInventory(): void {
    this.state.inventoryOpen = true;
    this.inventoryModal.style.display = "flex";
    this.renderModal();
  }

  private closeInventory(): void {
    this.state.inventoryOpen = false;
    this.inventoryModal.style.display = "none";
  }

  // ── FOV / enemies ────────────────────────────────────────────────

  private refreshFOV(): void {
    const map = currentMap(this.state);
    computeFOV(map, this.state.player.x, this.state.player.y, FOV_RADIUS);
    for (const e of currentEntities(this.state)) {
      if (e.type === "enemy" && !e.aware && map.isVisible(e.x, e.y)) {
        e.aware = true;
        this.addMessage(`${e.name ?? "Enemy"} spots you!`);
      }
    }
  }

  private moveEnemies(): void {
    const map = currentMap(this.state);
    const entities = currentEntities(this.state);
    const px = this.state.player.x;
    const py = this.state.player.y;

    for (const enemy of entities) {
      if (enemy.type !== "enemy" || !enemy.aware) continue;

      // ── Ranged — reposition to align for clear shot ────────────────
      if (enemy.rangedAtk !== undefined) {
        const rdx = px - enemy.x, rdy = py - enemy.y;
        // Already aligned on an axis — stay and fire
        if (rdx === 0 || rdy === 0) continue;
        // 50% chance to skip movement this turn
        if (Math.random() < 0.5) continue;
        // Try to close the smaller gap to achieve axis alignment
        const moveCandidates: [number, number][] = Math.abs(rdx) <= Math.abs(rdy)
          ? [[Math.sign(rdx), 0], [0, Math.sign(rdy)]]
          : [[0, Math.sign(rdy)], [Math.sign(rdx), 0]];
        for (const [mx, my] of moveCandidates) {
          const nx = enemy.x + mx, ny = enemy.y + my;
          if (map.isSolid(nx, ny)) continue;
          if (nx === px && ny === py) continue;
          const blocked = entities.some(e => e !== enemy && e.x === nx && e.y === ny && (e.type === "enemy" || e.type === "npc"));
          if (blocked) continue;
          enemy.x = nx; enemy.y = ny;
          break;
        }
        continue;
      }

      // ── Melee — charge player ───────────────────────────────────────
      if (Math.random() < 0.4) continue;

      const dx = Math.sign(px - enemy.x);
      const dy = Math.sign(py - enemy.y);
      const candidates: [number, number][] = [];
      if (dx !== 0 || dy !== 0) candidates.push([dx, dy]);
      if (dx !== 0) candidates.push([dx, 0]);
      if (dy !== 0) candidates.push([0, dy]);

      for (const [mx, my] of candidates) {
        const nx = enemy.x + mx;
        const ny = enemy.y + my;
        if (map.isSolid(nx, ny)) continue;
        if (nx === px && ny === py) continue;
        const blocked = entities.some(
          (e) => e !== enemy && e.x === nx && e.y === ny &&
                 (e.type === "enemy" || e.type === "npc")
        );
        if (blocked) continue;
        enemy.x = nx;
        enemy.y = ny;
        break;
      }
    }
  }

  private wizardsFire(): void {
    const entities = currentEntities(this.state);
    const px = this.state.player.x, py = this.state.player.y;

    for (const enemy of entities) {
      if (enemy.type !== "enemy" || enemy.rangedAtk === undefined || !enemy.aware) continue;

      // Cooldown — decrement and skip if still cooling
      if ((enemy.shootCooldown ?? 0) > 0) { enemy.shootCooldown!--; continue; }

      // Stable per-wizard ID (position-based ownerId breaks on movement)
      if (!enemy.uid) enemy.uid = Math.random().toString(36).slice(2);
      const ownerId = `w_${enemy.uid}`;

      // Only 1 active bolt per wizard
      if (this.state.projectiles.some(p => p.ownerId === ownerId)) continue;

      const dx = px - enemy.x, dy = py - enemy.y;
      if (dx === 0 && dy === 0) continue;

      const ddx = Math.sign(dx), ddy = Math.sign(dy);

      if (!this.wizardHasLoS(enemy.x, enemy.y, px, py, ddx, ddy)) continue;

      const stepX = enemy.x + ddx, stepY = enemy.y + ddy;

      if (stepX === px && stepY === py) {
        const dmg = Math.max(1, enemy.rangedAtk - this.playerTotalDef());
        this.state.player.hp = (this.state.player.hp ?? 0) - dmg;
        this.state.stats.hp = this.state.player.hp;
        this.state.totalDamageTaken += dmg;
        this.addMessage(`${enemy.name ?? "Wizard"} zaps you point-blank for ${dmg}!`);
        this.updateStatsUI();
        enemy.shootCooldown = 2;
        if (this.state.player.hp <= 0) { this.state.dead = true; this.showGameOver(enemy.name ?? "a wizard"); }
      } else {
        this.state.projectiles.push({ x: stepX, y: stepY, dx: ddx, dy: ddy, damage: enemy.rangedAtk, ownerId });
        enemy.shootCooldown = 2;
      }
    }
  }

  private wizardHasLoS(wx: number, wy: number, px: number, py: number, ddx: number, ddy: number): boolean {
    const map = currentMap(this.state);
    // FOV is the source of truth for wall/terrain LoS — if wizard tile is visible, no walls block
    if (!map.isVisible(wx, wy)) return false;
    // Walk bolt path for entity blockers (enemies, NPCs obstruct the shot)
    const entities = currentEntities(this.state);
    let cx = wx + ddx, cy = wy + ddy;
    for (let i = 0; i < 15; i++) {
      if (map.isSolid(cx, cy)) return false;
      if (cx === px && cy === py) return true;
      if (entities.some(e => e.x === cx && e.y === cy &&
          (e.type === "enemy" || e.type === "npc" || e.type === "building"))) return false;
      cx += ddx; cy += ddy;
    }
    return true;
  }

  private moveProjectiles(): void {
    if (this.state.projectiles.length === 0) return;
    const map = currentMap(this.state);
    const entities = currentEntities(this.state);
    const px = this.state.player.x, py = this.state.player.y;
    const alive: Projectile[] = [];

    for (const proj of this.state.projectiles) {
      const nx = proj.x + proj.dx;
      const ny = proj.y + proj.dy;

      if (map.isSolid(nx, ny)) continue;

      if (proj.fromPlayer) {
        // Player bolt — check enemy hit
        const hitIdx = entities.findIndex(e => e.x === nx && e.y === ny && e.type === "enemy");
        if (hitIdx !== -1) {
          const enemy = entities[hitIdx];
          const dmg = Math.max(1, proj.damage - (enemy.def ?? 0));
          enemy.hp = (enemy.hp ?? 1) - dmg;
          this.addMessage(`Your bolt hits ${enemy.name ?? "enemy"} for ${dmg}!`);
          this.updateStatsUI();
          if (enemy.hp <= 0) {
            this.addMessage(`${enemy.name ?? "Enemy"} dies!`);
            const cleanName = (enemy.name ?? "Unknown").replace(/\s*\[BOSS\]\s*/, "").trim();
            this.state.killCounts[cleanName] = (this.state.killCounts[cleanName] ?? 0) + 1;
            if (enemy.loot && enemy.loot.length > 0) {
              for (const drop of enemy.loot) { drop.x = enemy.x; drop.y = enemy.y; entities.push(drop); }
              this.addMessage("It drops loot.");
            }
            entities.splice(hitIdx, 1);
            if (enemy.xpReward) this.grantXp(enemy.xpReward);
          }
          continue; // bolt absorbed
        }
        alive.push({ ...proj, x: nx, y: ny });
        continue;
      }

      // Enemy bolt — blocked by solid entities
      const blocked = entities.some(e =>
        e.x === nx && e.y === ny &&
        e.type !== "item" && e.type !== "treasure" && e.type !== "portal" && e.type !== "door"
      );
      if (blocked) continue;

      if (nx === px && ny === py) {
        const dmg = Math.max(1, proj.damage - this.playerTotalDef());
        this.state.player.hp = (this.state.player.hp ?? 0) - dmg;
        this.state.stats.hp = this.state.player.hp;
        this.state.totalDamageTaken += dmg;
        this.addMessage(`A magical bolt strikes you for ${dmg}!`);
        this.updateStatsUI();
        if (this.state.player.hp <= 0) { this.state.dead = true; this.showGameOver("a magical bolt"); }
        continue;
      }

      alive.push({ ...proj, x: nx, y: ny });
    }

    this.state.projectiles = alive;
  }

  // ── Main update ──────────────────────────────────────────────────

  private update(): void {
    if (!this.state.started) return;
    if (this.state.dead) return;
    if (this.anyModalOpen()) {
      if (this.fireMode) { this.fireMode = false; this.canvas.style.cursor = ""; }
      return;
    }

    // Fire mode: next directional key fires a wand bolt
    if (this.fireMode) {
      const move = this.input.consumeMove();
      if (!move) return;
      this.fireMode = false;
      this.canvas.style.cursor = "";
      const s = this.state.stats;
      const mpCost = 4;
      if (s.mp < mpCost) { this.addMessage("Not enough mana to fire!"); return; }
      const fireX = this.state.player.x + move.dx;
      const fireY = this.state.player.y + move.dy;
      const map = currentMap(this.state);
      const entities = currentEntities(this.state);
      if (map.isSolid(fireX, fireY)) { this.addMessage("The bolt fizzles into the wall."); return; }
      s.mp -= mpCost;
      const boltDmg = 3 + Math.floor(Math.max(0, s.int - 10));
      // Adjacent enemy — instant hit (MP already deducted above)
      const adjIdx = entities.findIndex(e => e.x === fireX && e.y === fireY && e.type === "enemy");
      if (adjIdx !== -1) {
        this.applyWandHit(adjIdx, boltDmg);
        this.updateStatsUI();
        this.refreshFOV();
        this.moveEnemies();
        return;
      }
      // Non-adjacent — traveling projectile
      this.state.projectiles.push({ x: fireX, y: fireY, dx: move.dx, dy: move.dy, damage: boltDmg, ownerId: "player", fromPlayer: true });
      this.addMessage(`You fire a bolt. (MP: ${s.mp}/${s.maxMp})`);
      this.updateStatsUI();
      this.moveEnemies();
      return;
    }

    const move = this.input.consumeMove();
    if (!move) return;

    const newX = this.state.player.x + move.dx;
    const newY = this.state.player.y + move.dy;

    const map = currentMap(this.state);
    const entities = currentEntities(this.state);

    if (map.isSolid(newX, newY)) return;

    // Enemy combat
    const enemyIdx = entities.findIndex(
      (e) => e.x === newX && e.y === newY && e.type === "enemy"
    );
    if (enemyIdx !== -1) {
      const acted = this.combat(enemyIdx);
      if (acted) { this.refreshFOV(); this.moveEnemies(); }
      return;
    }

    // Chest bump — search for loot
    const chestIdx = entities.findIndex(
      (e) => e.x === newX && e.y === newY && e.type === "chest"
    );
    if (chestIdx !== -1) {
      const chest = entities[chestIdx];
      const dropX = chest.x, dropY = chest.y;
      entities.splice(chestIdx, 1);
      if (chest.loot && chest.loot.length > 0) {
        for (const item of chest.loot) {
          entities.push({ ...item, x: dropX, y: dropY });
        }
        const names = chest.loot.map(i => i.name ?? i.sprite);
        this.addMessage(`Crate breaks open — ${names.join(", ")} spills out.`);
      } else {
        this.addMessage("The crate is empty.");
      }
      return;
    }

    // NPC bump — check shopId first
    const npc = entities.find(
      (e) => e.x === newX && e.y === newY && e.type === "npc"
    );
    if (npc) {
      if (npc.behavior?.shopId) {
        this.openShop(npc.behavior.shopId as string);
      } else if (npc.behavior?.tips) {
        const tips = npc.behavior.tips as string[];
        const tip = tips[Math.floor(Math.random() * tips.length)];
        this.addMessage(`${npc.name ?? "NPC"}: "${tip}"`);
      } else {
        this.addMessage(`${npc.name ?? "NPC"}: "${npc.behavior?.dialogue ?? "..."}"`);
      }
      return;
    }

    // Door
    const doorIdx = entities.findIndex(
      (e) => e.x === newX && e.y === newY && e.type === "door"
    );
    if (doorIdx !== -1) {
      const door = entities[doorIdx];
      const keyIdx = this.state.inventory.findIndex(
        (it) => it.keyId && it.keyId === door.keyId
      );
      if (keyIdx === -1) {
        this.addMessage(`The ${door.name ?? "door"} is locked.`);
        return;
      }
      const key = this.state.inventory[keyIdx];
      this.state.inventory.splice(keyIdx, 1);
      entities.splice(doorIdx, 1);
      this.addMessage(`You unlock the door with ${key.name ?? "a key"}.`);
      this.updateInventoryUI();
    }

    this.state.player.x = newX;
    this.state.player.y = newY;

    // Portal
    const portal = entities.find(
      (e) => e.x === newX && e.y === newY && e.type === "portal"
    );
    if (portal && portal.behavior?.targetMap) {
      const target = portal.behavior.targetMap as string;
      const tx = (portal.behavior.targetX as number) ?? 1;
      const ty = (portal.behavior.targetY as number) ?? 1;
      // Auto-generate missing dungeon level
      if (!this.state.maps[target] && target.startsWith("dungeon_")) {
        const levelNum = parseInt(target.split("_")[1], 10);
        const prevId = this.state.currentMapId;
        const returnX = this.state.player.x;
        const returnY = this.state.player.y;
        const { size, diff } = this.levelSizeDiff(levelNum);
        const nextId = levelNum >= FINAL_LEVEL ? null : `dungeon_${levelNum + 1}`;
        const inst = generateDungeon(size, diff, levelNum, prevId, returnX, returnY, nextId);
        this.state.maps[target] = inst;
        this.dungeonMeta[target] = { size, diff };
        this.addMessage(levelNum >= FINAL_LEVEL
          ? "You descend into the archmage's sanctum. There is no going deeper."
          : `You descend to dungeon level ${levelNum} (${size}/${diff}).`);
      }
      if (this.state.maps[target]) {
        this.state.currentMapId = target;
        this.state.projectiles = [];
        const inst = this.state.maps[target];
        const spawn = findSpawn(inst.map, inst.entities, tx, ty);
        this.state.player.x = spawn.x;
        this.state.player.y = spawn.y;
        this.addMessage(`You enter ${portal.name ?? "the portal"}.`);
        this.refreshFOV();
        this.updateStatsUI();
        return;
      }
    }

    // Treasure
    const treasureIdx = entities.findIndex(
      (e) => e.x === newX && e.y === newY && e.type === "treasure"
    );
    if (treasureIdx !== -1) {
      const t = entities[treasureIdx];
      entities.splice(treasureIdx, 1);
      const g = t.gold ?? 0;
      this.state.gold += g;
      this.addMessage(`You pick up ${t.name ?? "treasure"} (+${g} gold).`);
      this.updateStatsUI();
    }

    // Items
    const itemIdx = entities.findIndex(
      (e) => e.x === newX && e.y === newY && e.type === "item"
    );
    if (itemIdx !== -1) {
      const item = entities[itemIdx];
      entities.splice(itemIdx, 1);
      this.state.inventory.push(item);
      this.addMessage(`You pick up ${item.name ?? "an item"}.`);
      this.updateInventoryUI();
      if (item.isFinalItem) {
        this.state.won = true;
        this.showVictory();
      }
    }

    this.refreshFOV();
    this.moveEnemies();
  }

  // ── Combat ───────────────────────────────────────────────────────

  private playerTotalAtk(): number {
    const base = this.state.equipped.weapon?.atk ?? 1;
    const strBonus = Math.max(0, Math.floor((this.state.stats.str - 10) / 2));
    return base + strBonus;
  }

  private playerTotalDef(): number {
    return (
      (this.state.equipped.armor?.def  ?? 0) +
      (this.state.equipped.shield?.def ?? 0) +
      (this.state.equipped.head?.def   ?? 0)
    );
  }

  private combat(enemyIdx: number): boolean {
    const entities = currentEntities(this.state);
    const enemy = entities[enemyIdx];
    const weapon = this.state.equipped.weapon;

    if (weapon?.isWand) return this.wandAttack(enemyIdx);

    const dmg = Math.max(1, this.playerTotalAtk() - (enemy.def ?? 0));
    const weaponName = weapon ? (weapon.name ?? "weapon") : "fists";

    enemy.hp = (enemy.hp ?? 1) - dmg;
    this.addMessage(`You hit ${enemy.name ?? "enemy"} with ${weaponName} for ${dmg}.`);

    if (enemy.hp <= 0) {
      this.addMessage(`${enemy.name ?? "Enemy"} dies!`);
      const cleanName = (enemy.name ?? "Unknown").replace(/\s*\[BOSS\]\s*/, "").trim();
      this.state.killCounts[cleanName] = (this.state.killCounts[cleanName] ?? 0) + 1;
      if (enemy.loot && enemy.loot.length > 0) {
        for (const drop of enemy.loot) { drop.x = enemy.x; drop.y = enemy.y; entities.push(drop); }
        this.addMessage(`It drops loot.`);
      }
      entities.splice(enemyIdx, 1);
      if (enemy.xpReward) this.grantXp(enemy.xpReward);
      return;
    }

    const retDmg = Math.max(1, (enemy.atk ?? 1) - this.playerTotalDef());
    const player = this.state.player;
    player.hp = (player.hp ?? 0) - retDmg;
    this.state.stats.hp = player.hp;
    this.state.totalDamageTaken += retDmg;
    this.addMessage(`${enemy.name ?? "Enemy"} hits you for ${retDmg}.`);
    this.updateStatsUI();
    if (player.hp <= 0) {
      this.state.dead = true;
      this.addMessage("You are dead.");
      this.showGameOver(enemy.name ?? "an unknown enemy");
    }
    return true;
  }

  private wandAttack(enemyIdx: number): boolean {
    const s = this.state.stats;
    const mpCost = 4;
    if (s.mp < mpCost) {
      this.addMessage("Not enough mana to fire the wand! (need 4 MP)");
      return false;
    }
    s.mp -= mpCost;
    const boltDmg = 3 + Math.floor(Math.max(0, s.int - 10));
    this.applyWandHit(enemyIdx, boltDmg);
    this.addMessage(`(MP: ${s.mp}/${s.maxMp})`);
    this.updateStatsUI();
    return true;
  }

  private applyWandHit(enemyIdx: number, boltDmg: number): void {
    const entities = currentEntities(this.state);
    const enemy = entities[enemyIdx];
    const dmg = Math.max(1, boltDmg - (enemy.def ?? 0));
    enemy.hp = (enemy.hp ?? 1) - dmg;
    this.addMessage(`Your bolt hits ${enemy.name ?? "enemy"} for ${dmg}!`);
    if (enemy.hp <= 0) {
      this.addMessage(`${enemy.name ?? "Enemy"} dies!`);
      const cleanName = (enemy.name ?? "Unknown").replace(/\s*\[BOSS\]\s*/, "").trim();
      this.state.killCounts[cleanName] = (this.state.killCounts[cleanName] ?? 0) + 1;
      if (enemy.loot) {
        for (const drop of enemy.loot) { drop.x = enemy.x; drop.y = enemy.y; entities.push(drop); }
        this.addMessage("It drops loot.");
      }
      entities.splice(enemyIdx, 1);
      if (enemy.xpReward) this.grantXp(enemy.xpReward);
    }
  }

  private levelSizeDiff(levelNum: number): { size: DungeonSize; diff: DungeonDifficulty } {
    if (levelNum >= FINAL_LEVEL) return { size: "large", diff: "ultra" };
    if (levelNum >= 5)           return { size: "large", diff: "hard"  };
    if (levelNum >= 3)           return { size: "medium", diff: "hard" };
    return { size: "small", diff: "easy" };
  }

  private formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const ss = String(s % 60).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  private showVictory(): void {
    const overlay = document.getElementById("victory-overlay")!;
    document.getElementById("v-name")!.textContent =
      `${this.state.playerName} conquered the Castle of the Winds`;

    const totalKills = Object.values(this.state.killCounts).reduce((a, b) => a + b, 0);
    const elapsed = this.formatTime(Date.now() - this.state.startTime);
    document.getElementById("v-stats")!.innerHTML =
      `<div class="v-row"><span>Time</span><span>${elapsed}</span></div>` +
      `<div class="v-row"><span>Monsters Slain</span><span>${totalKills}</span></div>` +
      `<div class="v-row"><span>Damage Taken</span><span>${this.state.totalDamageTaken}</span></div>` +
      `<div class="v-row"><span>Secrets Found</span><span>${this.state.secretsFound} / ???</span></div>`;

    const sorted = Object.entries(this.state.killCounts).sort((a, b) => b[1] - a[1]);
    const killsEl = document.getElementById("v-kills")!;
    killsEl.innerHTML = sorted.length === 0
      ? `<span style="color:#808080;">No kills recorded.</span>`
      : `<div style="font-weight:bold;color:#000080;margin-bottom:4px;">Kill Breakdown</div>` +
        sorted.map(([name, count]) =>
          `<div class="v-row"><span>${name}</span><span>${count}</span></div>`
        ).join("");

    overlay.style.display = "flex";
  }

  private showGameOver(killedBy: string): void {
    const overlay = document.getElementById("gameover-overlay")!;
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    const nameEl = document.getElementById("go-name");
    if (nameEl) nameEl.textContent = this.state.playerName;
    document.getElementById("go-date")!.textContent = `${mm}-${dd}-${yyyy}`;
    document.getElementById("go-killer")!.textContent = `Killed by ${killedBy}`;
    overlay.style.display = "flex";
  }

  // ── Inventory modal ──────────────────────────────────────────────

  private equip(idx: number): void {
    const item = this.state.inventory[idx];
    if (!item || !item.slot) return;
    const slot = item.slot;
    const prev = this.state.equipped[slot];
    this.state.inventory.splice(idx, 1);
    if (prev) this.state.inventory.push(prev);
    this.state.equipped[slot] = item;
    this.addMessage(`Equipped ${item.name ?? item.sprite}.`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderModal();
  }

  private drink(idx: number): void {
    const item = this.state.inventory[idx];
    if (!item?.healAmt) return;
    const player = this.state.player;
    const maxHp = player.maxHp ?? this.state.stats.maxHp;
    const before = player.hp ?? 0;
    player.hp = Math.min(maxHp, before + item.healAmt);
    this.state.stats.hp = player.hp;
    const gained = player.hp - before;
    this.state.inventory.splice(idx, 1);
    this.addMessage(`You drink ${item.name ?? "potion"} and restore ${gained} HP.`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderModal();
  }

  private useBooster(idx: number): void {
    const item = this.state.inventory[idx];
    if (!item?.boostStat || !item.boostAmt) return;
    const stat = item.boostStat;
    this.state.stats[stat] += item.boostAmt;
    // Update derived maxHp / maxMp
    if (stat === "con") {
      const newMax = 20 + Math.floor((this.state.stats.con - 10) * 2);
      this.state.stats.maxHp = newMax;
      this.state.player.maxHp = newMax;
    }
    if (stat === "int") {
      const newMax = 10 + Math.floor((this.state.stats.int - 10) * 2);
      this.state.stats.maxMp = newMax;
    }
    this.state.inventory.splice(idx, 1);
    this.addMessage(`You use ${item.name}. ${stat.toUpperCase()} +${item.boostAmt}!`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderModal();
  }

  private unequip(slot: EquipSlot): void {
    const item = this.state.equipped[slot];
    if (!item) return;
    delete this.state.equipped[slot];
    this.state.inventory.push(item);
    this.addMessage(`Unequipped ${item.name ?? item.sprite}.`);
    this.updateStatsUI();
    this.updateInventoryUI();
    this.renderModal();
  }

  private renderModal(): void {
    this.modalEquipped.innerHTML = "";
    for (const slot of SLOTS) {
      const item = this.state.equipped[slot];
      const row = document.createElement("div");
      row.className = "slot-row";
      const label = document.createElement("span");
      label.className = "slot-label";
      label.textContent = slot.toUpperCase();
      const val = document.createElement("span");
      val.className = "slot-val";
      val.textContent = item
        ? `${item.name ?? item.sprite}${item.atk ? ` (atk ${item.atk})` : ""}${item.def ? ` (def ${item.def})` : ""}`
        : "(empty)";
      row.appendChild(label);
      row.appendChild(val);
      if (item) {
        const btn = document.createElement("button");
        btn.textContent = "Remove";
        btn.onclick = () => this.unequip(slot);
        row.appendChild(btn);
      }
      this.modalEquipped.appendChild(row);
    }

    this.modalBag.innerHTML = "";
    if (this.state.inventory.length === 0) {
      this.modalBag.textContent = "(empty bag)";
      return;
    }

    // Stack consumables (no slot) by name; equipment shows individually
    type StackGroup = { item: Entity; count: number; firstIdx: number };
    const groups: StackGroup[] = [];
    const used = new Set<number>();
    this.state.inventory.forEach((item, idx) => {
      if (used.has(idx)) return;
      used.add(idx);
      if (item.slot) { groups.push({ item, count: 1, firstIdx: idx }); return; }
      const key = item.name ?? item.sprite;
      let count = 1;
      this.state.inventory.forEach((other, oidx) => {
        if (oidx <= idx || used.has(oidx) || other.slot) return;
        if ((other.name ?? other.sprite) === key) { count++; used.add(oidx); }
      });
      groups.push({ item, count, firstIdx: idx });
    });

    for (const { item, count, firstIdx } of groups) {
      const row = document.createElement("div");
      row.className = "bag-row";
      const name = document.createElement("span");
      name.style.flex = "1";
      name.textContent = (item.name ?? item.sprite) + (count > 1 ? ` (${count})` : "");
      row.appendChild(name);
      if (item.slot) {
        const btn = document.createElement("button");
        btn.textContent = `Equip (${item.slot})`;
        btn.onclick = () => this.equip(firstIdx);
        row.appendChild(btn);
      }
      if (item.healAmt) {
        const btn = document.createElement("button");
        btn.textContent = `Drink (+${item.healAmt})`;
        btn.onclick = () => this.drink(firstIdx);
        row.appendChild(btn);
      }
      if (item.boostStat) {
        const btn = document.createElement("button");
        btn.textContent = `Use`;
        btn.onclick = () => this.useBooster(firstIdx);
        row.appendChild(btn);
      }
      this.modalBag.appendChild(row);
    }
  }

  private updateInventoryUI(): void {
    const equippedCount = Object.values(this.state.equipped).filter(Boolean).length;
    const bagCount = this.state.inventory.length;
    if (bagCount === 0 && equippedCount === 0) {
      this.inventoryList.textContent = "Empty";
      return;
    }
    const lines: string[] = [];
    if (equippedCount > 0) lines.push(`<b>Equipped: ${equippedCount}</b>`);
    if (bagCount > 0) lines.push(`Bag: ${bagCount}`);
    lines.push(`<i>Press I</i>`);
    this.inventoryList.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
  }

  // ── XP / Leveling ────────────────────────────────────────────────

  private grantXp(amount: number): void {
    const s = this.state.stats;
    s.xp += amount;
    this.addMessage(`+${amount} XP.`);
    while (s.xp >= s.xpToNext) {
      s.xp -= s.xpToNext;
      s.level++;
      s.xpToNext = s.level * 100;
      s.statPoints += 3;
      const heal = 5;
      this.state.player.hp = Math.min(this.state.player.maxHp ?? s.maxHp, (this.state.player.hp ?? 0) + heal);
      s.hp = this.state.player.hp;
      this.addMessage(`Level up! You are now level ${s.level}. (+${heal} HP) Assign 3 stat points.`);
    }
    this.updateStatsUI();
    if (s.statPoints > 0 && !this.levelUpOpen) {
      this.openLevelUpModal();
    }
  }

  private openLevelUpModal(): void {
    this.levelUpOpen = true;
    const s = this.state.stats;
    this.levelUpBaseStats = { str: s.str, int: s.int, con: s.con, dex: s.dex, statPoints: s.statPoints };
    document.getElementById("levelup-title")!.textContent = `Level Up! — Level ${s.level}`;
    this.refreshLevelUpModal();
    document.getElementById("levelup-modal")!.style.display = "flex";
  }

  private resetLevelUpStats(): void {
    if (!this.levelUpBaseStats) return;
    const s = this.state.stats;
    const base = this.levelUpBaseStats;
    s.str = base.str; s.int = base.int; s.con = base.con; s.dex = base.dex;
    s.statPoints = base.statPoints;
    const newMaxHp = 20 + Math.floor((s.con - 10) * 2);
    const newMaxMp = 10 + Math.floor((s.int - 10) * 2);
    s.maxHp = newMaxHp; s.maxMp = newMaxMp;
    this.state.player.maxHp = newMaxHp;
    if ((this.state.player.hp ?? 0) > newMaxHp) { this.state.player.hp = newMaxHp; s.hp = newMaxHp; }
    if (s.mp > newMaxMp) s.mp = newMaxMp;
    this.refreshLevelUpModal();
    this.updateStatsUI();
  }

  private openHelp(): void {
    this.state.helpOpen = true;
    document.getElementById("help-modal")!.style.display = "flex";
  }

  private closeHelp(): void {
    this.state.helpOpen = false;
    document.getElementById("help-modal")!.style.display = "none";
  }

  private toggleHelp(): void {
    if (this.state.helpOpen) this.closeHelp(); else this.openHelp();
  }

  private statDescription(stat: string): string | null {
    switch (stat.toUpperCase().trim()) {
      case "STR": return "Strength — +1 ATK per 2 points above 10. If you want to hit harder, this is your stat.";
      case "DEX": return "Dexterity — Improves reaction speed and evasion. The quick inherit the loot.";
      case "INT": return "Intelligence — +1 max MP per 2 points above 10. Governs arcane potential.";
      case "CON": return "Constitution — +2 max HP per point above 10. More HP = more mistakes you can afford.";
      case "ATK": return "Attack — Damage per hit. Base weapon + STR bonus (+1 per 2 STR above 10).";
      case "ARMOR": return "Armor — Reduces incoming damage. Total of all equipped armor pieces.";
      case "HP": return "Hit Points — Reach 0 and you die. Restore with potions or rest in town (ESC → Menu).";
      case "MP": return "Mana Points — Reserved for arcane abilities. Restore by resting in town.";
      case "LVL": return "Level — Rises with XP from defeated enemies. Each level grants 3 stat points.";
      case "GOLD": return "Gold — Spend at the Blacksmith (weapons/armor) and Merchant (potions/scrolls).";
      default: return null;
    }
  }

  private refreshLevelUpModal(): void {
    const s = this.state.stats;
    document.getElementById("levelup-pts")!.textContent = `Points remaining: ${s.statPoints}`;
    document.getElementById("lu-str-val")!.textContent = String(s.str);
    document.getElementById("lu-int-val")!.textContent = String(s.int);
    document.getElementById("lu-con-val")!.textContent = String(s.con);
    document.getElementById("lu-dex-val")!.textContent = String(s.dex);
    const noPoints = s.statPoints === 0;
    (["str","int","con","dex"] as const).forEach(st => {
      const btn = document.getElementById(`lu-${st}-btn`) as HTMLButtonElement | null;
      if (btn) btn.disabled = noPoints;
    });
    const ok = document.getElementById("lu-ok-btn") as HTMLButtonElement | null;
    if (ok) ok.disabled = !noPoints;
  }

  private assignStatPoint(stat: "str" | "int" | "con" | "dex"): void {
    const s = this.state.stats;
    if (s.statPoints <= 0) return;
    s[stat]++;
    s.statPoints--;
    if (stat === "con") {
      const newMax = 20 + Math.floor((s.con - 10) * 2);
      s.maxHp = newMax;
      this.state.player.maxHp = newMax;
    }
    if (stat === "int") {
      const newMax = 10 + Math.floor((s.int - 10) * 2);
      s.maxMp = newMax;
    }
    this.refreshLevelUpModal();
    this.updateStatsUI();
  }

  private closeLevelUpModal(): void {
    if (this.state.stats.statPoints > 0) return;
    this.levelUpOpen = false;
    document.getElementById("levelup-modal")!.style.display = "none";
  }

  addMessage(text: string): void {
    this.state.messages.push(text);
    const p = document.createElement("p");
    p.textContent = text;
    this.messageLog.appendChild(p);
    this.messageLog.scrollTop = this.messageLog.scrollHeight;
  }

  private updateStatsUI(): void {
    const s     = this.state.stats;
    const hp    = this.state.player.hp ?? s.hp;
    const maxHp = this.state.player.maxHp ?? s.maxHp;
    const mapId = this.state.currentMapId;
    const floorEl = document.getElementById("stat-floor");
    if (floorEl) {
      floorEl.textContent = mapId.startsWith("dungeon_")
        ? `${mapId.split("_")[1]} / ${FINAL_LEVEL}`
        : "Town";
    }
    document.getElementById("stat-level")!.textContent  = String(s.level);
    const xpPct = Math.min(100, Math.floor((s.xp / s.xpToNext) * 100));
    const xpBar = document.getElementById("stat-xp-bar") as HTMLElement | null;
    if (xpBar) xpBar.style.width = `${xpPct}%`;
    document.getElementById("stat-xp-text")!.textContent = `${s.xp} / ${s.xpToNext} XP`;
    const hpEl = document.getElementById("stat-hp")!;
    hpEl.textContent = `${hp}/${maxHp}`;
    hpEl.style.color = hp <= Math.ceil(maxHp * 0.25) ? "#cc0000" : "";
    document.getElementById("stat-mp")!.textContent    = `${s.mp}/${s.maxMp}`;
    document.getElementById("stat-atk")!.textContent   = String(this.playerTotalAtk());
    document.getElementById("stat-armor")!.textContent = String(this.playerTotalDef());
    document.getElementById("stat-gold")!.textContent  = String(this.state.gold);
    document.getElementById("stat-str")!.textContent   = String(s.str);
    document.getElementById("stat-int")!.textContent   = String(s.int);
    document.getElementById("stat-con")!.textContent   = String(s.con);
    document.getElementById("stat-dex")!.textContent   = String(s.dex);
  }
}
