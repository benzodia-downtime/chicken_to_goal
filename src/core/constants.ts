export const BOARD_COLS = 6;
export const BOARD_ROWS = 5;
export const TILE_COUNT = BOARD_COLS * BOARD_ROWS;

export const MINE_COUNT = 10;
export const MAX_MINE_COUNT = 20;
export const SAFE_COUNT = TILE_COUNT - MINE_COUNT;

export const START_INDEX = 0;
export const GOAL_INDEX = TILE_COUNT - 1;

export const RESERVED_SAFE_INDICES = [START_INDEX, GOAL_INDEX, 1, BOARD_COLS];
