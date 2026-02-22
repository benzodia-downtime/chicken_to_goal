export type GamePhase = "ready" | "playing" | "dead" | "clear";

export interface GameState {
  phase: GamePhase;
  currentIndex: number;
  steps: number;
  visitedSafe: Set<number>;
}

export function createInitialState(
  startIndex: number,
  phase: GamePhase,
): GameState {
  return {
    phase,
    currentIndex: startIndex,
    steps: 0,
    visitedSafe: new Set([startIndex]),
  };
}
