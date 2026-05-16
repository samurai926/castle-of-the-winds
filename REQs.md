PRD: Project "Aero-Castle" (AI-Driven Pixel Crawler)
1. Executive Summary
Goal: Create a 2D pixel-art dungeon crawler inspired by Castle of the Winds (1992).
Core Innovation: The game must be "engine-less" (Vanilla TypeScript/HTML5 Canvas) and use a Generative Logic Bridge. The world, quests, and dungeon layouts are not hard-coded; they are interpreted from JSON schemas that an LLM can generate.

2. Technical Stack
Language: TypeScript (for type-safe game state).

Rendering: HTML5 Canvas API (No Phaser, No Unity).

Assets: Single Sprite Atlas (32x32 tiles).

Architecture: Model-View-Controller (MVC).

Model: A JSON-based State Machine.

View: A Canvas renderer that maps JSON IDs to Sprite coordinates.

3. System Architecture & "The AI Bridge"
Claude should build the game to be schema-driven.

Map Schema: A 2D array of integers or strings (e.g., 0 for grass, 1 for wall).

Entity Schema: A list of objects with x, y, type (NPC, Item, Portal), and behavior (dialogue, lock_requirement).

The AI Hook: A dedicated WorldGenerator.ts class.

Initial version: Uses local "Mock AI" JSON files.

Final version: Ready for an API fetch to an LLM to generate the next floor's JSON.

4. Functional Requirements
Phase 1: The "Legacy" Engine
Movement: 8-directional movement (including diagonals) via Numpad or WASD.

Inventory System: Weight/Bulk based (not slot-based). Must support "Containers" (e.g., a bag inside a pack).

Tile-Based Collision: Player cannot walk through walls (#) or NPCs (&).

Phase 2: The World & Quest Logic
Town State: A safe zone with at least 3 houses and 1 NPC.

The "Gatekeeper" Puzzle:

The Cave Entrance is "Locked" or "Blocked" by a specific flag.

The NPC has a conditional dialogue: IF player_has_item('Rusted Sword') THEN trigger_event('OpenCave').

Transition System: Stepping on a "Portal" tile (∩) triggers a world-swap from Town_Map to Dungeon_Level_1.

Phase 3: The Dungeon
Fog of War: Tiles are black until the player moves within a 3-tile radius.

Procedural Content: The dungeon must be generated via a "Random Walk" or "BSP" algorithm, but the flavor (mobs, loot) should be pullable from a JSON config.

5. Visual Guidelines (The "Castle" Aesthetic)
Background: Solid light-gray or white UI borders (Windows 3.1 style).

Sprites: Use the provided 32x32 pixel art sheet.

UI: A sidebar showing:

Current Stats (Str, Int, Con, Dex).

Visual Inventory (Drag-and-drop simulation or right-click to equip).

Message Log (e.g., "You see a Rusted Dagger here.").

6. User Stories for Claude Code
Map Rendering: "As a player, I want to see a grid-based map rendered from a JSON array so that the world feels structured."

Interaction: "As a player, I want to 'bump' into an NPC to trigger a text box so I can receive a quest."

Inventory: "As a player, I want to pick up a sword and see my weight increase, so that I feel the encumbrance mechanic of the original game."

7. Acceptance Criteria (MVP)
[ ] Game runs in a single index.html/script.ts file (via Vite or similar).

[ ] Player can move from a Town to a Dungeon.

[ ] A "Locked" door can only be opened after finding a specific item in the town.

[ ] The code includes a generateLevel(seed) function that creates a new layout without hard-coded coordinates.