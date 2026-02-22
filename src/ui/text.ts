export const UI_TEXT = {
  layoutExhausted: "경로 생성에 실패했습니다. 지뢰 수를 줄여주세요.",
  readyPrompt: "지뢰 수량을 입력하고 시작을 눌러주세요.",
  newRound: (mineCount: number) => `새 게임 시작. 지뢰 ${mineCount}개 배치 완료.`,
  invalidMove: "대각선을 포함해 인접한 한 칸만 이동할 수 있어요.",
  safeTile: (tileId: number) => `${tileId}번 타일은 안전합니다. GOAL로 이동하세요.`,
  mineTriggered: (tileId: number) => `${tileId}번 타일에서 지뢰가 터졌습니다.`,
  win: "치킨 뽑기 성공! 탈출 완료!",
  noEscapeRoute: "현재 판에는 탈출 경로가 없습니다.",
  shortestRoute: (moves: number) => `최단 탈출 경로 표시: ${moves}칸`,
} as const;
