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
  tileSize: number;
}

interface FireworkArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface OutcomeHooks {
  setRevealMines: (value: boolean) => void;
  renderAllTiles: () => void;
  setFailOverlay: (show: boolean) => void;
  setWinOverlay: (show: boolean) => void;
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
  private celebrationLoop: gsap.core.Timeline | null = null;

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
    this.stopCelebrationLoop();
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
    hooks.setWinOverlay(false);
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
    this.stopCelebrationLoop();
    context.state.phase = "clear";
    hooks.setRevealMines(true);
    hooks.setFailOverlay(false);
    hooks.setWinOverlay(true);
    hooks.setRouteButtonCollapsed(true);
    this.clearFailureFeather();
    this.token.visible = true;
    hooks.renderAllTiles();

    const goalCenter = context.tileViews[targetIndex].center;
    const kickoffX = goalCenter.x + randomRange(-context.tileSize * 1.4, context.tileSize * 1.4);
    const kickoffY =
      goalCenter.y - context.tileSize * (0.25 + Math.random() * 0.5);
    hooks.setStatus(`\uC131\uACF5! ${message}`, "win");
    this.vfx.flash("rgba(255, 219, 111, 0.88)", 0.88, 0.5);
    this.vfx.burst(kickoffX, kickoffY, 0xffd666, 42, 88);
    this.vfx.burst(kickoffX, kickoffY, 0x8affdc, 28, 76);
    this.startCelebrationLoop(context);
    this.audio.playWin();
    this.celebrateSafeTiles(context.board, context.state, context.tileViews);
  }

  public clearFailureFeather(): void {
    this.stopCelebrationLoop();
    if (!this.failureFeather) {
      return;
    }
    gsap.killTweensOf(this.failureFeather);
    this.failureFeather.destroy();
    this.failureFeather = null;
  }

  private celebrateSafeTiles(
    board: BoardData,
    state: GameState,
    tileViews: TileView[],
  ): void {
    for (const tile of board.tiles) {
      if (tile.isMine || !state.visitedSafe.has(tile.index)) {
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

  private startCelebrationLoop(context: OutcomeContext): void {
    this.stopCelebrationLoop();
    const area = this.resolveFireworkArea(context.tileViews, context.tileSize);

    let wave = 0;
    const nextWave = (): void => {
      this.launchVictoryFireworks(area, wave);
      wave = (wave + 1) % 6;
    };

    this.celebrationLoop = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    this.celebrationLoop.call(nextWave, [], 0);
    this.celebrationLoop.call(nextWave, [], 0.4);
    this.celebrationLoop.call(nextWave, [], 0.84);
  }

  private stopCelebrationLoop(): void {
    if (!this.celebrationLoop) {
      return;
    }
    this.celebrationLoop.kill();
    this.celebrationLoop = null;
  }

  private launchVictoryFireworks(area: FireworkArea, wave: number): void {
    const palette = [0xffd666, 0x8affdc, 0xff97c2, 0x9ecbff, 0xc7ff8a];
    const burstCount = 5 + (wave % 3);

    for (let shot = 0; shot < burstCount; shot += 1) {
      const point = this.pickFireworkPoint(area, wave, shot);
      const primary = palette[(shot + wave) % palette.length];
      const secondary = palette[(shot + wave + 2) % palette.length];

      this.vfx.ringPulse(point.x, point.y, primary);
      this.vfx.burst(point.x, point.y, primary, 22 + wave * 2, 80 + shot * 3);
      this.vfx.burst(point.x, point.y, secondary, 15 + wave, 66 + shot * 2);
    }
  }

  private resolveFireworkArea(tileViews: TileView[], tileSize: number): FireworkArea {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const view of tileViews) {
      const { x, y } = view.center;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const half = tileSize * 0.5;
    const padX = Math.max(34, tileSize * 0.8);
    const padTop = Math.max(22, tileSize * 0.45);
    const padBottom = Math.max(56, tileSize * 1.2);
    const left = minX - half - padX;
    const right = maxX + half + padX;
    const top = minY - half - padTop;
    const bottom = maxY + half + padBottom;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  private pickFireworkPoint(area: FireworkArea, wave: number, shot: number): PIXI.Point {
    const lane = (wave + shot) % 3;
    const laneCenter = lane === 0 ? 0.2 : lane === 1 ? 0.5 : 0.8;
    const xBase = area.left + area.width * laneCenter;
    const xJitter = area.width * (0.08 + Math.random() * 0.14);
    const yBand = 0.34 + ((wave + shot) % 4) * 0.13;
    const yBase = area.top + area.height * yBand;

    return new PIXI.Point(
      xBase + randomRange(-xJitter, xJitter),
      yBase + randomRange(-area.height * 0.07, area.height * 0.07),
    );
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

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
