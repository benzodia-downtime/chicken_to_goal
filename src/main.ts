import "./style.css";
import { GameScene } from "./render/scene";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error("#app element not found.");
}

root.innerHTML = `
  <div class="aurora aurora-a"></div>
  <div class="aurora aurora-b"></div>

  <main class="shell">
    <section class="stage-frame">
      <div class="game-panel">
        <div class="board-area">
          <div id="flashLayer"></div>
          <div id="pixiStage" aria-label="Mine board"></div>
          <div id="failOverlay" class="fail-overlay hidden" aria-hidden="true">
            <p id="failText" class="fail-text">실패!</p>
          </div>

          <p id="statusText" class="status floating-status"></p>

          <div id="startOverlay" class="start-overlay">
            <div class="start-card">
              <h1 class="start-title">키르의 치킨 뽑기</h1>
              <label for="mineInput" class="start-label">지뢰 수량을 입력하세요</label>
              <div class="mine-stepper">
                <button id="mineDownButton" class="step-btn" type="button" aria-label="지뢰 수량 감소">&lt;</button>
                <input id="mineInput" class="mine-input" type="number" min="1" max="20" value="10" />
                <button id="mineUpButton" class="step-btn" type="button" aria-label="지뢰 수량 증가">&gt;</button>
              </div>
              <button id="startButton" class="btn">시작</button>
            </div>
          </div>
        </div>

        <div class="top-controls">
          <button id="restartButton" class="btn">새 게임</button>
          <button id="routeButton" class="btn btn-ghost">탈출로 탐색</button>
          <button id="muteButton" class="btn btn-ghost">소리 끄기</button>
          <label class="volume-control" for="masterVolumeInput">
            <span class="volume-label">마스터 볼륨</span>
            <input
              id="masterVolumeInput"
              class="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value="0.84"
            />
            <span id="masterVolumeValue" class="volume-value">84%</span>
          </label>
        </div>
      </div>
    </section>
  </main>
`;

const scene = new GameScene({
  stageHost: requireElement<HTMLDivElement>("#pixiStage"),
  flashLayer: requireElement<HTMLDivElement>("#flashLayer"),
  failOverlay: requireElement<HTMLDivElement>("#failOverlay"),
  failText: requireElement<HTMLParagraphElement>("#failText"),
  startOverlay: requireElement<HTMLDivElement>("#startOverlay"),
  mineDownButton: requireElement<HTMLButtonElement>("#mineDownButton"),
  mineUpButton: requireElement<HTMLButtonElement>("#mineUpButton"),
  startButton: requireElement<HTMLButtonElement>("#startButton"),
  restartButton: requireElement<HTMLButtonElement>("#restartButton"),
  routeButton: requireElement<HTMLButtonElement>("#routeButton"),
  muteButton: requireElement<HTMLButtonElement>("#muteButton"),
  masterVolumeInput: requireElement<HTMLInputElement>("#masterVolumeInput"),
  masterVolumeValue: requireElement<HTMLSpanElement>("#masterVolumeValue"),
  statusText: requireElement<HTMLParagraphElement>("#statusText"),
  mineInput: requireElement<HTMLInputElement>("#mineInput"),
});

window.addEventListener("beforeunload", () => {
  scene.destroy();
});

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}
