import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import type { BoardData } from "../core/board";
import type { GameState } from "../core/gameState";
import { evaluateLanding, type LandingResult } from "../core/rules";
import type { TileView } from "./viewTypes";

export interface MoveEnvironment {
  board: BoardData;
  state: GameState;
  tileViews: TileView[];
  tileSize: number;
}

export interface MoveHooks {
  isRoundValid: () => boolean;
  drawTrail: (fromIndex: number, toIndex: number, color: number) => void;
  renderAllTiles: () => void;
  onMine: (targetIndex: number) => void;
  onGoal: (targetIndex: number) => void;
  onSafe: (targetIndex: number, destination: PIXI.Point) => void;
}

export class MovementController {
  private readonly token: PIXI.Container;

  public constructor(token: PIXI.Container) {
    this.token = token;
  }

  public snapToken(x: number, y: number): void {
    this.token.position.set(x, y);
  }

  public tweenToken(x: number, y: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(this.token, {
        x,
        y,
        duration,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: resolve,
        onInterrupt: resolve,
      });
    });
  }

  public async moveTo(
    targetIndex: number,
    environment: MoveEnvironment,
    hooks: MoveHooks,
  ): Promise<void> {
    const fromIndex = environment.state.currentIndex;
    const destination = environment.tileViews[targetIndex].center;
    const landing = evaluateLanding(environment.board, targetIndex);
    const trailColor = landing === "mine" ? 0xff7878 : 0x63f7d8;

    environment.state.steps += 1;
    environment.state.currentIndex = targetIndex;

    hooks.drawTrail(fromIndex, targetIndex, trailColor);
    hooks.renderAllTiles();

    await this.tweenToken(destination.x, destination.y, landing === "mine" ? 0.22 : 0.18);
    if (!hooks.isRoundValid()) {
      return;
    }

    await this.playLandingReveal(targetIndex, landing, environment);
    if (!hooks.isRoundValid()) {
      return;
    }

    if (landing !== "mine") {
      environment.state.visitedSafe.add(targetIndex);
    }

    if (landing === "mine") {
      hooks.onMine(targetIndex);
      return;
    }

    if (landing === "goal") {
      hooks.onGoal(targetIndex);
      return;
    }

    hooks.renderAllTiles();
    hooks.onSafe(targetIndex, destination);
  }

  private async playLandingReveal(
    targetIndex: number,
    landing: LandingResult,
    environment: MoveEnvironment,
  ): Promise<void> {
    const view = environment.tileViews[targetIndex];
    const veil = new PIXI.Graphics();
    const badge = new PIXI.Text("?", {
      fontFamily: "Archivo Black, sans-serif",
      fontSize: 20,
      fill: 0xe6f1ff,
    });
    badge.anchor.set(0.5);
    badge.position.set(environment.tileSize / 2, environment.tileSize / 2);

    const drawVeil = (fill: number, stroke: number, alpha: number): void => {
      veil.clear();
      veil.lineStyle(2, stroke, Math.min(1, alpha + 0.12));
      veil.beginFill(fill, alpha);
      veil.drawRoundedRect(0, 0, environment.tileSize, environment.tileSize, 8);
      veil.endFill();
    };

    view.container.addChild(veil);
    view.container.addChild(badge);
    view.container.scale.set(1, 1);

    if (landing === "mine") {
      drawVeil(0x7b202c, 0xffa8b5, 0.85);
      badge.text = "!";
      badge.style = new PIXI.TextStyle({
        fontFamily: "Archivo Black, sans-serif",
        fontSize: 20,
        fill: 0xffd8df,
      });

      const baseX = view.container.x;
      const baseY = view.container.y;
      const warnShake = gsap.to(view.container, {
        x: baseX + 1.3,
        duration: 0.025,
        yoyo: true,
        repeat: 7,
        ease: "sine.inOut",
      });

      await this.sleep(200);
      warnShake.kill();
      view.container.position.set(baseX, baseY);
    } else {
      drawVeil(0x18e464, 0xb5ffc0, 0.87);
      badge.text = "OK";
      badge.style = new PIXI.TextStyle({
        fontFamily: "Archivo Black, sans-serif",
        fontSize: 15,
        fill: 0x073119,
      });

      gsap.to(view.container.scale, {
        x: 1.08,
        y: 1.08,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        overwrite: true,
      });
      await this.sleep(200);
    }

    badge.destroy();
    veil.destroy();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}
