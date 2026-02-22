import {
  BOARD_COLS,
  BOARD_ROWS,
  MAX_MINE_COUNT,
  MINE_COUNT,
  RESERVED_SAFE_INDICES,
  START_INDEX,
} from "./constants";
import { UnsolvableBoardError } from "./errors";
import { hashSeed, mulberry32, shuffleInPlace } from "./rng";
import { findShortestPath } from "./rules";

export interface TileData {
  index: number;
  id: number;
  row: number;
  col: number;
  isMine: boolean;
}

export interface BoardData {
  seed: number;
  cols: number;
  rows: number;
  mineCount: number;
  safeCount: number;
  startIndex: number;
  goalIndex: number;
  tiles: TileData[];
  mineSet: Set<number>;
}

interface BoardOptions {
  seed?: number | string;
  cols?: number;
  rows?: number;
  mineCount?: number;
}

const MAX_LAYOUT_ATTEMPTS = 4000;

export function createBoard(options: BoardOptions = {}): BoardData {
  const cols = options.cols ?? BOARD_COLS;
  const rows = options.rows ?? BOARD_ROWS;
  const tileCount = cols * rows;
  const requestedMineCount = options.mineCount ?? MINE_COUNT;

  const startIndex = START_INDEX;
  const goalIndex = tileCount - 1;
  const defaultSeed = options.seed ?? Date.now();
  const hashedSeed = hashSeed(defaultSeed);

  const reservedSafe = RESERVED_SAFE_INDICES.filter(
    (index) => index >= 0 && index < tileCount,
  );
  const reservedSafeSet = new Set<number>(reservedSafe);

  const candidateIndices: number[] = [];
  for (let index = 0; index < tileCount; index += 1) {
    if (!reservedSafeSet.has(index)) {
      candidateIndices.push(index);
    }
  }

  const maxMines = Math.min(MAX_MINE_COUNT, candidateIndices.length - 1);
  const mineCount = Math.max(
    1,
    Math.min(maxMines, Math.floor(requestedMineCount)),
  );

  if (mineCount >= candidateIndices.length) {
    throw new Error("Mine count is too high for this board configuration.");
  }

  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
    const trialSeed = (hashedSeed + attempt * 7919) >>> 0;
    const random = mulberry32(trialSeed);
    const shuffled = candidateIndices.slice();
    shuffleInPlace(shuffled, random);
    const mineSet = new Set<number>(shuffled.slice(0, mineCount));

    if (findShortestPath(startIndex, goalIndex, cols, rows, mineSet)) {
      return {
        seed: trialSeed,
        cols,
        rows,
        mineCount,
        safeCount: tileCount - mineCount,
        startIndex,
        goalIndex,
        mineSet,
        tiles: buildTiles(cols, rows, mineSet),
      };
    }
  }

  throw new UnsolvableBoardError();
}

function buildTiles(cols: number, rows: number, mineSet: Set<number>): TileData[] {
  const tiles: TileData[] = [];
  const tileCount = cols * rows;

  for (let index = 0; index < tileCount; index += 1) {
    tiles.push({
      index,
      id: index + 1,
      row: Math.floor(index / cols),
      col: index % cols,
      isMine: mineSet.has(index),
    });
  }

  return tiles;
}
