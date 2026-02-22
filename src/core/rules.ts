import type { BoardData } from "./board";
import type { GameState } from "./gameState";

export type LandingResult = "safe" | "mine" | "goal";

export function getNeighbors(
  index: number,
  cols: number,
  rows: number,
): number[] {
  const neighbors: number[] = [];
  const row = Math.floor(index / cols);
  const col = index % cols;

  if (col > 0) neighbors.push(index - 1);
  if (col < cols - 1) neighbors.push(index + 1);
  if (row > 0) neighbors.push(index - cols);
  if (row < rows - 1) neighbors.push(index + cols);

  if (row > 0 && col > 0) neighbors.push(index - cols - 1);
  if (row > 0 && col < cols - 1) neighbors.push(index - cols + 1);
  if (row < rows - 1 && col > 0) neighbors.push(index + cols - 1);
  if (row < rows - 1 && col < cols - 1) neighbors.push(index + cols + 1);

  return neighbors;
}

export function findShortestPath(
  startIndex: number,
  goalIndex: number,
  cols: number,
  rows: number,
  blocked: Set<number>,
): number[] | null {
  if (blocked.has(startIndex) || blocked.has(goalIndex)) {
    return null;
  }

  const tileCount = cols * rows;
  const previous = new Int16Array(tileCount);
  previous.fill(-1);

  const queue = new Int16Array(tileCount);
  let head = 0;
  let tail = 0;
  queue[tail] = startIndex;
  tail += 1;
  previous[startIndex] = startIndex;

  while (head < tail) {
    const current = queue[head];
    head += 1;

    if (current === goalIndex) {
      break;
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      if (blocked.has(neighbor) || previous[neighbor] !== -1) {
        continue;
      }

      previous[neighbor] = current;
      queue[tail] = neighbor;
      tail += 1;
    }
  }

  if (previous[goalIndex] === -1) {
    return null;
  }

  const path: number[] = [];
  let cursor = goalIndex;
  while (cursor !== startIndex) {
    path.push(cursor);
    cursor = previous[cursor];
  }
  path.push(startIndex);
  path.reverse();
  return path;
}

export function canMoveTo(
  board: BoardData,
  state: GameState,
  targetIndex: number,
): boolean {
  if (state.phase === "dead" || state.phase === "clear") {
    return false;
  }

  if (targetIndex < 0 || targetIndex >= board.tiles.length) {
    return false;
  }

  if (targetIndex === state.currentIndex) {
    return false;
  }

  return getNeighbors(state.currentIndex, board.cols, board.rows).includes(
    targetIndex,
  );
}

export function evaluateLanding(
  board: BoardData,
  targetIndex: number,
): LandingResult {
  if (board.tiles[targetIndex].isMine) {
    return "mine";
  }

  if (targetIndex === board.goalIndex) {
    return "goal";
  }

  return "safe";
}

export function getKeyboardTarget(
  currentIndex: number,
  key: string,
  cols: number,
  rows: number,
): number | null {
  const normalized = key.toLowerCase();
  const row = Math.floor(currentIndex / cols);
  const col = currentIndex % cols;

  if ((normalized === "arrowleft" || normalized === "a") && col > 0) {
    return currentIndex - 1;
  }

  if ((normalized === "arrowright" || normalized === "d") && col < cols - 1) {
    return currentIndex + 1;
  }

  if ((normalized === "arrowup" || normalized === "w") && row > 0) {
    return currentIndex - cols;
  }

  if ((normalized === "arrowdown" || normalized === "s") && row < rows - 1) {
    return currentIndex + cols;
  }

  if ((normalized === "q" || normalized === "home") && row > 0 && col > 0) {
    return currentIndex - cols - 1;
  }

  if ((normalized === "e" || normalized === "pageup") && row > 0 && col < cols - 1) {
    return currentIndex - cols + 1;
  }

  if ((normalized === "z" || normalized === "end") && row < rows - 1 && col > 0) {
    return currentIndex + cols - 1;
  }

  if ((normalized === "c" || normalized === "pagedown") && row < rows - 1 && col < cols - 1) {
    return currentIndex + cols + 1;
  }

  return null;
}
