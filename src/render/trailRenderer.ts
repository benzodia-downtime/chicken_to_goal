import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import { destroyChildren } from "./pixiChildren";

export class TrailRenderer {
  private readonly layer: PIXI.Container;

  public constructor(layer: PIXI.Container) {
    this.layer = layer;
  }

  public drawTrail(from: PIXI.Point, to: PIXI.Point, color: number): void {
    const line = new PIXI.Graphics();
    line.lineStyle(4, color, 0.2, 0.5);
    line.moveTo(from.x, from.y);
    line.lineTo(to.x, to.y);
    line.lineStyle(2, color, 0.84, 0.5);
    line.moveTo(from.x, from.y);
    line.lineTo(to.x, to.y);

    this.layer.addChild(line);

    gsap.to(line, {
      alpha: 0.72,
      duration: 0.18,
      ease: "power2.out",
    });
  }

  public clear(): void {
    destroyChildren(this.layer);
  }
}
