import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import type { BoardData } from "../core/board";
import type { GameState } from "../core/gameState";
import type { StatusTone } from "./statusTone";
import type { TileView } from "./viewTypes";

interface VfxLike {
  burst: (x: number, y: number, color: number, count: number, speed?: number) => void;
  ringPulse: (x: number, y: number, color: number) => void;
  shake: (target: PIXI.Container, intensity?: number, duration?: number) => void;
  flash: (color: string, peak?: number, duration?: number) => void;
}

interface AudioLike {
  playMine: () => void;
  playWin: () => void;
}

export interface OutcomeContext {
  board: BoardData;
  state: GameState;
  tileViews: TileView[];
}

export interface OutcomeHooks {
  setRevealMines: (value: boolean) => void;
  renderAllTiles: () => void;
  setFailOverlay: (show: boolean) => void;
  setRouteButtonCollapsed: (collapsed: boolean) => void;
  setStatus: (message: string, tone: StatusTone) => void;
}

export class RoundOutcomeController {
  private readonly vfx: VfxLike;
  private readonly audio: AudioLike;
  private readonly camera: PIXI.Container;
  private readonly token: PIXI.Container;
  private readonly fxLayer: PIXI.Container;
  private failureFeather: PIXI.Graphics | null = null;

  public constructor(
    vfx: VfxLike,
    audio: AudioLike,
    camera: PIXI.Container,
    token: PIXI.Container,
    fxLayer: PIXI.Container,
  ) {
    this.vfx = vfx;
    this.audio = audio;
    this.camera = camera;
    this.token = token;
    this.fxLayer = fxLayer;
  }

  public handleMine(
    targetIndex: number,
    context: OutcomeContext,
    hooks: OutcomeHooks,
    message: string,
  ): void {
    context.state.phase = "dead";
    hooks.setRevealMines(true);
    hooks.renderAllTiles();

    const center = context.tileViews[targetIndex].center;
    this.vfx.burst(center.x, center.y, 0xff5f5f, 34, 94);
    this.vfx.ringPulse(center.x, center.y, 0xffb1b1);
    this.vfx.shake(this.camera, 12, 0.45);
    this.token.visible = false;
    this.showFailureFeather(center.x, center.y);
    hooks.setFailOverlay(true);
    hooks.setRouteButtonCollapsed(false);
    this.audio.playMine();
    hooks.setStatus(message, "lose");
  }

  public handleClear(
    targetIndex: number,
    context: OutcomeContext,
    hooks: OutcomeHooks,
    message: string,
  ): void {
    context.state.phase = "clear";
    hooks.setFailOverlay(false);
    hooks.setRouteButtonCollapsed(true);
    this.clearFailureFeather();
    this.token.visible = true;
    hooks.renderAllTiles();

    const center = context.tileViews[targetIndex].center;
    this.vfx.flash("rgba(255, 219, 111, 0.88)", 0.88, 0.5);
    this.vfx.burst(center.x, center.y, 0xffd666, 42, 88);
    this.vfx.burst(center.x, center.y, 0x8affdc, 28, 76);
    this.audio.playWin();
    this.celebrateSafeTiles(context.board, context.tileViews);
    hooks.setStatus(message, "win");
  }

  public clearFailureFeather(): void {
    if (!this.failureFeather) {
      return;
    }
    gsap.killTweensOf(this.failureFeather);
    this.failureFeather.destroy();
    this.failureFeather = null;
  }

  private celebrateSafeTiles(board: BoardData, tileViews: TileView[]): void {
    for (const tile of board.tiles) {
      if (tile.isMine) {
        continue;
      }

      const view = tileViews[tile.index];
      gsap.to(view.container.scale, {
        x: 1.06,
        y: 1.06,
        duration: 0.16,
        delay: tile.index * 0.008,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }
  }

  private showFailureFeather(x: number, y: number): void {
    this.clearFailureFeather();

    const feather = new PIXI.Graphics();
    feather.lineStyle(1.5, 0x8f5c32, 0.95);
    feather.beginFill(0xfff3dc, 1);
    feather.moveTo(0, -14);
    feather.bezierCurveTo(8, -11, 10, -2, 4, 6);
    feather.bezierCurveTo(-1, 12, -8, 11, -10, 3);
    feather.bezierCurveTo(-11, -4, -7, -11, 0, -14);
    feather.closePath();
    feather.endFill();
    feather.lineStyle(1.2, 0xc79a64, 0.9);
    feather.moveTo(-0.5, -12);
    feather.lineTo(0.8, 9.5);

    feather.position.set(x, y - 6);
    feather.rotation = -0.28;
    this.fxLayer.addChild(feather);
    this.failureFeather = feather;

    gsap.to(feather, {
      y: y - 18,
      rotation: 0.2,
      alpha: 0.82,
      duration: 0.75,
      ease: "sine.out",
      yoyo: true,
      repeat: -1,
    });
  }
}
