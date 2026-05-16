export type Direction = { dx: number; dy: number };

/**
 * Maps keyboard input to 8-directional movement.
 * Supports both WASD and Numpad layouts.
 */
export class InputHandler {
  private pendingMove: Direction | null = null;

  constructor() {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const dir = this.keyToDirection(e.key);
    if (dir) {
      e.preventDefault();
      this.pendingMove = dir;
    }
  }

  consumeMove(): Direction | null {
    const move = this.pendingMove;
    this.pendingMove = null;
    return move;
  }

  private keyToDirection(key: string): Direction | null {
    switch (key) {
      // WASD
      case "w": case "W": return { dx: 0, dy: -1 };
      case "s": case "S": return { dx: 0, dy: 1 };
      case "a": case "A": return { dx: -1, dy: 0 };
      case "d": case "D": return { dx: 1, dy: 0 };
      // WASD diagonals (QE, ZC)
      case "q": case "Q": return { dx: -1, dy: -1 };
      case "e": case "E": return { dx: 1, dy: -1 };
      case "z": case "Z": return { dx: -1, dy: 1 };
      case "c": case "C": return { dx: 1, dy: 1 };
      // Numpad
      case "Numpad8": case "ArrowUp":    return { dx: 0, dy: -1 };
      case "Numpad2": case "ArrowDown":  return { dx: 0, dy: 1 };
      case "Numpad4": case "ArrowLeft":  return { dx: -1, dy: 0 };
      case "Numpad6": case "ArrowRight": return { dx: 1, dy: 0 };
      case "Numpad7": return { dx: -1, dy: -1 };
      case "Numpad9": return { dx: 1, dy: -1 };
      case "Numpad1": return { dx: -1, dy: 1 };
      case "Numpad3": return { dx: 1, dy: 1 };
      default: return null;
    }
  }
}
