import { SpriteSheet } from "./view/SpriteSheet";
import { Renderer } from "./view/Renderer";
import { InputHandler } from "./controller/InputHandler";
import { GameController } from "./controller/GameController";
import { GameState, Entity } from "./model/GameState";
import { townMap, townEntities } from "./data/townMap";
import { SPRITE_DEFS, generateAtlas } from "./data/spriteAtlas";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // fall back gracefully if missing
    img.src = src;
  });
}

async function bootstrap() {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

  const castleImg = await loadImage("/castle.png");
  const atlasDataUrl = generateAtlas(castleImg);
  const sprites = new SpriteSheet(atlasDataUrl, SPRITE_DEFS);

  const player: Entity = {
    x: 9, y: 15,
    type: "player",
    sprite: "player",
    name: "Player",
    hp: 20,
    maxHp: 20,
    atk: 1,
  };

  const townEntityList = [...townEntities];
  const townCrates = townEntityList.filter(e => e.type === "chest");
  if (townCrates.length > 0) {
    const luckyIdx = Math.floor(Math.random() * townCrates.length);
    const luckyCrate = townCrates[luckyIdx];
    luckyCrate.loot = luckyCrate.loot ?? [];
    luckyCrate.loot.push({
      x: 0, y: 0, type: "item", sprite: "rusty_sword",
      name: "Rusted Sword", slot: "weapon", atk: 3, price: 15,
    });
  }

  const state: GameState = {
    maps: {
      town: { map: townMap, entities: townEntityList },
    },
    currentMapId: "town",
    player,
    inventory: [],
    equipped: {},
    stats: { str: 10, int: 10, con: 10, dex: 10, hp: 20, maxHp: 20, mp: 10, maxMp: 10, level: 1, xp: 0, xpToNext: 100, statPoints: 0 },
    gold: 0,
    messages: ["Welcome to Castle of the Winds."],
    inventoryOpen: false,
    dead: false,
    playerName: "Adventurer",
    mapMode: false,
    started: false,
    debugOpen: false,
    mainMenuOpen: false,
    shopOpen: false,
    activeShopId: null,
    mapModeReturnId: null,
    helpOpen: false,
    mapPreviewMeta: null,
    projectiles: [],
  };

  // Restart shortcut: skip title screen, reuse saved name
  const autoName = sessionStorage.getItem("autostart");
  if (autoName !== null) {
    sessionStorage.removeItem("autostart");
    state.playerName = autoName || "Adventurer";
    state.started = true;
    const ss = document.getElementById("start-screen");
    if (ss) ss.style.display = "none";
  }

  const checkReady = setInterval(() => {
    if (sprites.isLoaded()) {
      clearInterval(checkReady);
      const renderer = new Renderer(canvas, sprites, 15, 15, 32);
      const input = new InputHandler();
      const controller = new GameController(state, input, renderer);
      controller.start();
    }
  }, 16);
}

bootstrap();
