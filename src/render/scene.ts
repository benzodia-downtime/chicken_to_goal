import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { AudioManager } from "../audio/audioManager";
import { createBoard, type BoardData } from "../core/board";
import { MAX_MINE_COUNT } from "../core/constants";
import { UnsolvableBoardError } from "../core/errors";
import { createInitialState, type GameState } from "../core/gameState";
import {
  canMoveTo,
  getKeyboardTarget,
} from "../core/rules";
import { VfxManager } from "../fx/vfx";
import { UI_TEXT } from "../ui/text";
import { EscapeRouteOverlay } from "./escapeRouteOverlay";
import { MovementController } from "./movementController";
import { RoundOutcomeController } from "./roundOutcomeController";
import { SceneUiController } from "./sceneUiController";
import { TrailRenderer } from "./trailRenderer";
import { TileRenderSystem } from "./tiles/tileRenderSystem";
import { TileViewFactory } from "./tiles/tileViewFactory";
import { GOAL_LAYOUT, GoalVisualFactory } from "./visuals/goalVisualFactory";
import { PlayerVisualFactory } from "./visuals/playerVisualFactory";
import type { GoalView, PlayerView, TileView } from "./viewTypes";
import type { OutcomeContext, OutcomeHooks } from "./roundOutcomeController";
import type { StatusTone } from "./statusTone";
import type { TileRenderContext } from "./tiles/tileRenderSystem";

export interface SceneBindings {
  stageHost: HTMLDivElement;
  flashLayer: HTMLDivElement;
  failOverlay: HTMLDivElement;
  failText: HTMLParagraphElement;
  startOverlay: HTMLDivElement;
  mineDownButton: HTMLButtonElement;
  mineUpButton: HTMLButtonElement;
  startButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  routeButton: HTMLButtonElement;
  muteButton: HTMLButtonElement;
  statusText: HTMLParagraphElement;
  mineInput: HTMLInputElement;
}

export class GameScene {
  private readonly app: PIXI.Application;
  private readonly audio = new AudioManager();
  private readonly ui: SceneBindings;
  private readonly uiController: SceneUiController;
  private readonly domEventController = new AbortController();

  private readonly camera = new PIXI.Container();
  private readonly boardBackdrop = new PIXI.Graphics();
  private readonly guideLayer = new PIXI.Container();
  private readonly pathLayer = new PIXI.Container();
  private readonly trailRenderer = new TrailRenderer(this.pathLayer);
  private readonly routeLayer = new PIXI.Container();
  private readonly routeOverlay = new EscapeRouteOverlay(this.routeLayer);
  private readonly tileRenderer = new TileRenderSystem();
  private readonly tileLayer = new PIXI.Container();
  private readonly tokenLayer = new PIXI.Container();
  private readonly fxLayer = new PIXI.Container();

  private readonly token = new PIXI.Container();
  private readonly movementController = new MovementController(this.token);
  private readonly outcomeController: RoundOutcomeController;
  private readonly vfx: VfxManager;
  private readonly playerVisualFactory = new PlayerVisualFactory();
  private readonly goalVisualFactory = new GoalVisualFactory();
  private readonly tileViewFactory = new TileViewFactory(() => this.createGoalView());
  private readonly outcomeHooks: OutcomeHooks = {
    setRevealMines: (value) => {
      this.revealMines = value;
    },
    renderAllTiles: () => {
      this.renderAllTiles();
    },
    setFailOverlay: (show) => {
      this.setFailOverlay(show);
    },
    setRouteButtonCollapsed: (collapsed) => {
      this.setRouteButtonCollapsed(collapsed);
    },
    setStatus: (message, tone) => {
      this.setStatus(message, tone);
    },
  };

  private board: BoardData;
  private state: GameState;
  private tileViews: TileView[] = [];
  private player: PlayerView | null = null;
  private selectedMineCount = 10;
  private revealMines = false;
  private isBusy = false;
  private hoverIndex: number | null = null;
  private roundVersion = 0;

  private tileSize = 74;
  private tileGap = 11;
  private boardOriginX = 0;
  private boardOriginY = 0;
  private boardWidth = 0;
  private boardHeight = 0;

  private readonly handleResize = (): void => {
    this.layoutBoard();
    this.clearPathLayer();
    this.redrawEscapeRoute();
    this.placeToken(this.state.currentIndex, true);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const target = getKeyboardTarget(
      this.state.currentIndex,
      event.key,
      this.board.cols,
      this.board.rows,
    );

    if (target === null) {
      return;
    }

    event.preventDefault();
    void this.beginAndMove(target);
  };

  public constructor(ui: SceneBindings) {
    this.ui = ui;
    this.uiController = new SceneUiController(ui);
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
    PIXI.settings.ROUND_PIXELS = false;
    this.app = new PIXI.Application({
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: ui.stageHost,
      powerPreference: "high-performance",
    });

    ui.stageHost.appendChild(this.app.view as HTMLCanvasElement);

    this.vfx = new VfxManager(this.fxLayer, ui.flashLayer);
    this.outcomeController = new RoundOutcomeController(
      this.vfx,
      this.audio,
      this.camera,
      this.token,
      this.fxLayer,
    );
    this.board = createBoard({ mineCount: this.selectedMineCount });
    this.state = createInitialState(this.board.startIndex, "ready");

    this.setupLayers();
    this.setupToken();
    this.setupUi();

    this.resetRound(false);
  }

  public destroy(): void {
    this.domEventController.abort();
    this.vfx.clear();
    this.outcomeController.clearFailureFeather();
    this.killDisplayTreeTweens(this.app.stage);
    this.uiController.destroy();
    this.app.destroy(true);
  }

  private setupLayers(): void {
    this.camera.addChild(this.boardBackdrop);
    this.camera.addChild(this.pathLayer);
    this.camera.addChild(this.tileLayer);
    this.camera.addChild(this.routeLayer);
    this.camera.addChild(this.tokenLayer);
    this.camera.addChild(this.fxLayer);
    this.camera.addChild(this.guideLayer);
    this.app.stage.addChild(this.camera);
  }

  private setupToken(): void {
    this.player = this.createPlayerView();

    this.token.addChild(this.player.shadow);
    this.token.addChild(this.player.root);
    this.tokenLayer.addChild(this.token);

    gsap.to(this.player.hookLine.scale, {
      y: 0.94,
      duration: 0.55,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  private createPlayerView(): PlayerView {
    return this.playerVisualFactory.create();
  }

  private createGoalView(): GoalView {
    return this.goalVisualFactory.create();
  }

  private setupUi(): void {
    const { signal } = this.domEventController;
    window.addEventListener("resize", this.handleResize, { signal });
    window.addEventListener("keydown", this.handleKeyDown, { signal });

    this.ui.mineDownButton.addEventListener("click", () => {
      this.stepMineCount(-1);
    }, { signal });

    this.ui.mineUpButton.addEventListener("click", () => {
      this.stepMineCount(1);
    }, { signal });

    this.ui.restartButton.addEventListener("click", () => {
      this.resetRound(true, true);
    }, { signal });

    this.ui.routeButton.addEventListener("click", () => {
      this.showEscapeRoute();
    }, { signal });

    this.ui.startButton.addEventListener("click", () => {
      void this.startFromOverlay();
    }, { signal });

    this.ui.muteButton.addEventListener("click", () => {
      this.audio.toggleMute();
      this.updateMuteButton();
    }, { signal });

    this.setRouteButtonCollapsed(true);
    this.updateMuteButton();
  }

  private stepMineCount(delta: number): void {
    const current = this.readMineCount();
    const next = Math.max(1, Math.min(MAX_MINE_COUNT, current + delta));
    this.ui.mineInput.value = String(next);
  }

  private startNewRoundCycle(): void {
    this.roundVersion += 1;
    gsap.killTweensOf(this.token);
  }

  private resetRoundVisualState(): void {
    this.revealMines = false;
    this.isBusy = false;
    this.hoverIndex = null;
    this.vfx.clear();
    this.clearGuideLayer();
    this.clearPathLayer();
    this.clearEscapeRoute();
    this.outcomeController.clearFailureFeather();
    this.token.visible = true;
    this.setFailOverlay(false);
    this.setRouteButtonCollapsed(true);
  }

  private resetRound(playRestartSfx: boolean, forceReady = false): void {
    this.startNewRoundCycle();

    const nextPhase = forceReady
      ? "ready"
      : this.audio.isUnlocked()
        ? "playing"
        : "ready";
    try {
      this.board = createBoard({ mineCount: this.selectedMineCount });
    } catch (error) {
      if (!(error instanceof UnsolvableBoardError)) {
        throw error;
      }

      this.state.phase = "ready";
      this.resetRoundVisualState();
      this.updateStartOverlay();
      this.setStatus(UI_TEXT.layoutExhausted, "lose");
      return;
    }

    this.state = createInitialState(this.board.startIndex, nextPhase);
    this.resetRoundVisualState();

    if (this.tileViews.length === 0) {
      this.createTileViews();
    }

    this.layoutBoard();
    this.placeToken(this.state.currentIndex, true);
    this.renderAllTiles();
    this.updateStartOverlay();

    if (nextPhase === "ready") {
      this.setStatus(UI_TEXT.readyPrompt, "neutral");
    } else {
      this.setStatus(UI_TEXT.newRound(this.board.mineCount), "neutral");
      if (playRestartSfx) {
        this.audio.playRestart();
      }
    }
  }

  private createTileViews(): void {
    this.tileViews = this.tileViewFactory.create(this.board, this.tileLayer, {
      onTap: (index) => {
        void this.beginAndMove(index);
      },
      onHover: (index) => {
        if (this.isBusy || this.state.phase !== "playing") {
          return;
        }

        if (!canMoveTo(this.board, this.state, index)) {
          return;
        }

        this.hoverIndex = index;
        this.renderTile(index);
        this.renderMoveGuides();
      },
      onHoverOut: (index) => {
        if (this.hoverIndex !== index) {
          return;
        }

        this.hoverIndex = null;
        this.renderTile(index);
        this.renderMoveGuides();
      },
    });
  }

  private layoutBoard(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const margin = Math.max(24, Math.round(Math.min(width, height) * 0.04));
    this.tileGap = Math.max(10, Math.round(Math.min(width, height) * 0.016));

    const tileW =
      (width - margin * 2 - this.tileGap * (this.board.cols - 1)) / this.board.cols;
    const tileH =
      (height - margin * 2 - this.tileGap * (this.board.rows - 1)) / this.board.rows;

    this.tileSize = Math.max(48, Math.floor(Math.min(tileW, tileH) * 0.9));
    this.boardWidth = this.tileSize * this.board.cols + this.tileGap * (this.board.cols - 1);
    this.boardHeight = this.tileSize * this.board.rows + this.tileGap * (this.board.rows - 1);
    this.boardOriginX = Math.floor((width - this.boardWidth) / 2);
    this.boardOriginY = Math.floor((height - this.boardHeight) / 2);

    this.redrawBackdrop();
    this.redrawPlayerScale();

    for (const tile of this.board.tiles) {
      const view = this.tileViews[tile.index];
      const x = this.boardOriginX + tile.col * (this.tileSize + this.tileGap);
      const y = this.boardOriginY + tile.row * (this.tileSize + this.tileGap);

      view.container.position.set(x, y);
      view.center.set(x + this.tileSize / 2, y + this.tileSize / 2);
      view.label.position.set(this.tileSize / 2, this.tileSize / 2);
      view.mineMark.position.set(this.tileSize / 2, this.tileSize / 2);
      this.tileRenderer.redrawMineMark(view.mineMark, this.tileSize);

      if (view.goal) {
        const goalScale = Math.max(0.82, this.tileSize / 76);
        view.goal.root.scale.set(goalScale);
        view.goal.root.position.set(
          this.tileSize / 2 + GOAL_LAYOUT.rootOffset.x,
          this.tileSize / 2 + GOAL_LAYOUT.rootOffset.y,
        );
      }
    }

    this.renderAllTiles();
  }

  private redrawPlayerScale(): void {
    if (!this.player) {
      return;
    }

    const scale = Math.max(0.74, this.tileSize / 82);
    this.player.root.scale.set(scale);
    this.player.shadow.scale.set(scale);
  }

  private redrawBackdrop(): void {
    const pad = 6;
    const left = this.boardOriginX - pad;
    const top = this.boardOriginY - pad;
    const width = this.boardWidth + pad * 2;
    const height = this.boardHeight + pad * 2;

    this.boardBackdrop.clear();
    this.boardBackdrop.lineStyle(2, 0x5f7fa5, 0.5);
    this.boardBackdrop.beginFill(0x0b1624, 0.86);
    this.boardBackdrop.drawRoundedRect(left, top, width, height, 7);
    this.boardBackdrop.endFill();

    this.boardBackdrop.lineStyle(1, 0x9ec3f5, 0.24);
    this.boardBackdrop.drawRoundedRect(left + 2, top + 2, width - 4, height - 4, 6);
  }

  private async beginAndMove(targetIndex: number): Promise<void> {
    if (this.state.phase === "ready") {
      await this.startFromOverlay();
    }

    if (this.state.phase !== "playing") {
      return;
    }

    if (!canMoveTo(this.board, this.state, targetIndex)) {
      this.setStatus(UI_TEXT.invalidMove, "neutral");
      return;
    }

    await this.moveTo(targetIndex);
  }

  private async startFromOverlay(): Promise<void> {
    if (this.state.phase !== "ready") {
      return;
    }

    this.selectedMineCount = this.readMineCount();
    await this.audio.unlock();
    this.resetRound(false);
    this.updateMuteButton();
    this.audio.playRestart();
  }

  private async moveTo(targetIndex: number): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    const moveRoundVersion = this.roundVersion;

    try {
      await this.movementController.moveTo(
        targetIndex,
        {
          board: this.board,
          state: this.state,
          tileViews: this.tileViews,
          tileSize: this.tileSize,
        },
        {
          isRoundValid: () => moveRoundVersion === this.roundVersion,
          drawTrail: (fromIndex, toIndex, color) => {
            this.drawTrail(fromIndex, toIndex, color);
          },
          renderAllTiles: () => {
            this.renderAllTiles();
          },
          onMine: (index) => {
            this.handleMine(index);
          },
          onGoal: (index) => {
            this.handleClear(index);
          },
          onSafe: (index, destination) => {
            this.audio.playWin();
            this.vfx.ringPulse(destination.x, destination.y, 0x80ffe3);
            this.vfx.burst(destination.x, destination.y, 0x66f6de, 12, 46);
            this.setStatus(UI_TEXT.safeTile(index + 1), "neutral");
          },
        },
      );
    } finally {
      if (moveRoundVersion === this.roundVersion) {
        this.isBusy = false;
      }
    }
  }

  private handleMine(targetIndex: number): void {
    this.outcomeController.handleMine(
      targetIndex,
      this.createOutcomeContext(),
      this.outcomeHooks,
      UI_TEXT.mineTriggered(targetIndex + 1),
    );
  }

  private handleClear(targetIndex: number): void {
    this.outcomeController.handleClear(
      targetIndex,
      this.createOutcomeContext(),
      this.outcomeHooks,
      UI_TEXT.win,
    );
  }

  private drawTrail(fromIndex: number, toIndex: number, color: number): void {
    const from = this.tileViews[fromIndex].center;
    const to = this.tileViews[toIndex].center;
    this.trailRenderer.drawTrail(from, to, color);
  }

  private clearPathLayer(): void {
    this.trailRenderer.clear();
  }

  private killDisplayTreeTweens(target: PIXI.DisplayObject): void {
    gsap.killTweensOf(target);
    const transformTarget = target as {
      scale?: PIXI.ObservablePoint;
      position?: PIXI.ObservablePoint;
      pivot?: PIXI.ObservablePoint;
    };
    if (transformTarget.scale) {
      gsap.killTweensOf(transformTarget.scale);
    }
    if (transformTarget.position) {
      gsap.killTweensOf(transformTarget.position);
    }
    if (transformTarget.pivot) {
      gsap.killTweensOf(transformTarget.pivot);
    }

    if (target instanceof PIXI.Container) {
      for (const child of target.children) {
        this.killDisplayTreeTweens(child);
      }
    }
  }

  private showEscapeRoute(): void {
    const route = this.routeOverlay.show(this.board, this.tileViews);
    if (!route || route.length < 2) {
      this.setStatus(UI_TEXT.noEscapeRoute, "lose");
      return;
    }

    this.setStatus(UI_TEXT.shortestRoute(route.length - 1), "neutral");
  }

  private redrawEscapeRoute(): void {
    this.routeOverlay.redraw(this.board, this.tileViews);
  }

  private clearEscapeRoute(): void {
    this.routeOverlay.clear();
  }

  private createOutcomeContext(): OutcomeContext {
    return {
      board: this.board,
      state: this.state,
      tileViews: this.tileViews,
    };
  }

  private renderMoveGuides(): void {
    this.tileRenderer.renderMoveGuides(this.createTileRenderContext(), this.guideLayer);
  }

  private clearGuideLayer(): void {
    this.tileRenderer.clearContainer(this.guideLayer);
  }

  private placeToken(index: number, instant: boolean): void {
    const target = this.tileViews[index].center;
    if (instant) {
      this.movementController.snapToken(target.x, target.y);
      return;
    }
    void this.movementController.tweenToken(target.x, target.y, 0.2);
  }

  private renderAllTiles(): void {
    this.tileRenderer.renderAllTiles(this.createTileRenderContext(), this.guideLayer);
  }

  private renderTile(index: number): void {
    this.tileRenderer.renderTile(this.createTileRenderContext(), index);
  }

  private createTileRenderContext(): TileRenderContext {
    return {
      board: this.board,
      state: this.state,
      tileViews: this.tileViews,
      revealMines: this.revealMines,
      hoverIndex: this.hoverIndex,
      tileSize: this.tileSize,
    };
  }

  private readMineCount(): number {
    const raw = Number.parseInt(this.ui.mineInput.value, 10);
    const clamped = Math.max(
      1,
      Math.min(MAX_MINE_COUNT, Number.isFinite(raw) ? raw : 10),
    );
    this.ui.mineInput.value = String(clamped);
    return clamped;
  }

  private setStatus(message: string, tone: StatusTone): void {
    this.uiController.setStatus(message, tone);
  }

  private updateStartOverlay(): void {
    this.uiController.updateStartOverlay(this.state.phase);
  }

  private setFailOverlay(show: boolean): void {
    this.uiController.setFailOverlay(show);
  }

  private setRouteButtonCollapsed(collapsed: boolean): void {
    this.uiController.setRouteButtonCollapsed(collapsed);
  }

  private updateMuteButton(): void {
    this.uiController.updateMuteButton(this.audio.isMuted());
  }
}
