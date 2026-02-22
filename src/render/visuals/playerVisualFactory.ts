import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import type { ChickenView, PlayerView } from "../viewTypes";

export class PlayerVisualFactory {
  public create(): PlayerView {
    const shadow = new PIXI.Graphics();
    const root = new PIXI.Container();
    const hookLine = new PIXI.Graphics();
    const hookHead = new PIXI.Graphics();
    const clawBridge = new PIXI.Graphics();
    const leftClaw = new PIXI.Graphics();
    const rightClaw = new PIXI.Graphics();
    const chicken = this.createChickenView();

    root.addChild(hookLine);
    root.addChild(hookHead);
    root.addChild(chicken.root);
    root.addChild(clawBridge);
    root.addChild(leftClaw);
    root.addChild(rightClaw);

    const player = {
      shadow,
      root,
      chicken,
      hookLine,
      hookHead,
      clawBridge,
      leftClaw,
      rightClaw,
    };

    this.redraw(player);
    return player;
  }

  public redraw(player: PlayerView): void {
    player.shadow.clear();
    player.shadow.beginFill(0x000000, 0.24);
    player.shadow.drawEllipse(0, 23, 16, 5.5);
    player.shadow.endFill();

    player.hookLine.clear();
    player.hookLine.lineStyle(2.2, 0xdde7f2, 0.95);
    player.hookLine.moveTo(0, -33);
    player.hookLine.lineTo(0, -12);

    player.hookHead.clear();
    player.hookHead.beginFill(0xc8d8ea, 1);
    player.hookHead.drawRoundedRect(-4.6, -38, 9.2, 6.2, 2);
    player.hookHead.endFill();
    player.hookHead.lineStyle(1.2, 0x94aec8, 1);
    player.hookHead.moveTo(-3.6, -31.8);
    player.hookHead.lineTo(-1, -28.8);
    player.hookHead.moveTo(3.6, -31.8);
    player.hookHead.lineTo(1, -28.8);

    player.clawBridge.clear();
    player.clawBridge.lineStyle(2.4, 0xc8d8ea, 1);
    player.clawBridge.moveTo(-8.4, -11.3);
    player.clawBridge.lineTo(8.4, -11.3);
    player.clawBridge.beginFill(0xaec4dd, 1);
    player.clawBridge.drawRoundedRect(-7.4, -12.8, 14.8, 3.2, 1.2);
    player.clawBridge.endFill();

    player.leftClaw.clear();
    player.leftClaw.lineStyle(2.5, 0xa8bfd8, 1);
    player.leftClaw.beginFill(0xd8e6f4, 1);
    player.leftClaw.moveTo(-8.4, -11.2);
    player.leftClaw.lineTo(-14.6, -2.6);
    player.leftClaw.lineTo(-14.1, 9.1);
    player.leftClaw.lineTo(-10.2, 12.6);
    player.leftClaw.lineTo(-7.4, 10.8);
    player.leftClaw.lineTo(-10.1, 8.3);
    player.leftClaw.lineTo(-10.5, -1.4);
    player.leftClaw.lineTo(-5.8, -8.8);
    player.leftClaw.closePath();
    player.leftClaw.endFill();
    player.leftClaw.beginFill(0x94afcb, 1);
    player.leftClaw.drawRoundedRect(-13.5, 8.6, 2.4, 4.2, 1);
    player.leftClaw.endFill();

    player.rightClaw.clear();
    player.rightClaw.lineStyle(2.5, 0xa8bfd8, 1);
    player.rightClaw.beginFill(0xd8e6f4, 1);
    player.rightClaw.moveTo(8.4, -11.2);
    player.rightClaw.lineTo(14.6, -2.6);
    player.rightClaw.lineTo(14.1, 9.1);
    player.rightClaw.lineTo(10.2, 12.6);
    player.rightClaw.lineTo(7.4, 10.8);
    player.rightClaw.lineTo(10.1, 8.3);
    player.rightClaw.lineTo(10.5, -1.4);
    player.rightClaw.lineTo(5.8, -8.8);
    player.rightClaw.closePath();
    player.rightClaw.endFill();
    player.rightClaw.beginFill(0x94afcb, 1);
    player.rightClaw.drawRoundedRect(11.1, 8.6, 2.4, 4.2, 1);
    player.rightClaw.endFill();

    player.chicken.root.position.set(0, 9.4);
  }

  private createChickenView(): ChickenView {
    const root = new PIXI.Container();
    const body = new PIXI.Graphics();
    const leftWing = new PIXI.Container();
    const rightWing = new PIXI.Container();
    const leftWingShape = new PIXI.Graphics();
    const rightWingShape = new PIXI.Graphics();
    const head = new PIXI.Graphics();
    const comb = new PIXI.Graphics();
    const beak = new PIXI.Graphics();
    const eye = new PIXI.Graphics();
    const feet = new PIXI.Graphics();
    const tail = new PIXI.Graphics();

    leftWing.addChild(leftWingShape);
    rightWing.addChild(rightWingShape);

    root.addChild(feet);
    root.addChild(tail);
    root.addChild(leftWing);
    root.addChild(rightWing);
    root.addChild(body);
    root.addChild(head);
    root.addChild(comb);
    root.addChild(beak);
    root.addChild(eye);

    const chicken = {
      root,
      body,
      leftWing,
      rightWing,
      leftWingShape,
      rightWingShape,
      head,
      comb,
      beak,
      eye,
      feet,
      tail,
    };

    this.redrawChicken(chicken);
    this.playChickenIdle(chicken);
    return chicken;
  }

  private redrawChicken(chicken: ChickenView): void {
    chicken.feet.clear();
    chicken.feet.lineStyle(2, 0xe7a946, 1);
    chicken.feet.moveTo(-5.5, 16);
    chicken.feet.lineTo(-5.5, 21.5);
    chicken.feet.moveTo(5.5, 16);
    chicken.feet.lineTo(5.5, 21.5);
    chicken.feet.moveTo(-8.5, 21.5);
    chicken.feet.lineTo(-3, 21.5);
    chicken.feet.moveTo(3, 21.5);
    chicken.feet.lineTo(8.5, 21.5);

    chicken.tail.clear();
    chicken.tail.lineStyle(2, 0xceb99b, 1);
    chicken.tail.beginFill(0xf6e2c4, 1);
    chicken.tail.moveTo(0, 11);
    chicken.tail.lineTo(-4, 17.5);
    chicken.tail.lineTo(0, 15);
    chicken.tail.lineTo(4, 17.5);
    chicken.tail.closePath();
    chicken.tail.endFill();

    chicken.leftWing.position.set(-13.3, 2.2);
    chicken.leftWing.pivot.set(3.4, -1.2);
    chicken.leftWing.rotation = -0.28;

    chicken.leftWingShape.clear();
    chicken.leftWingShape.lineStyle(2, 0xd3bea1, 1);
    chicken.leftWingShape.beginFill(0xf9e9ce, 1);
    chicken.leftWingShape.drawRoundedRect(-10, -4.5, 11, 13, 3);
    chicken.leftWingShape.endFill();

    chicken.rightWing.position.set(13.3, 2.2);
    chicken.rightWing.pivot.set(-3.4, -1.2);
    chicken.rightWing.rotation = 0.28;

    chicken.rightWingShape.clear();
    chicken.rightWingShape.lineStyle(2, 0xd3bea1, 1);
    chicken.rightWingShape.beginFill(0xf9e9ce, 1);
    chicken.rightWingShape.drawRoundedRect(-1, -4.5, 11, 13, 3);
    chicken.rightWingShape.endFill();

    chicken.body.clear();
    chicken.body.lineStyle(2, 0xd3bea1, 1);
    chicken.body.beginFill(0xfff0d8, 1);
    chicken.body.drawRoundedRect(-14, -2, 28, 20, 7);
    chicken.body.beginFill(0xf9e3c4, 1);
    chicken.body.drawRoundedRect(-8, 8.6, 16, 7.4, 3);
    chicken.body.endFill();

    chicken.head.clear();
    chicken.head.lineStyle(2, 0xd3bea1, 1);
    chicken.head.beginFill(0xfff0d8, 1);
    chicken.head.drawRoundedRect(-8.5, -16.2, 17, 12.4, 4);
    chicken.head.endFill();

    chicken.comb.clear();
    chicken.comb.beginFill(0xec5a5a, 1);
    chicken.comb.drawRoundedRect(-5.6, -20.5, 4.1, 4, 1.2);
    chicken.comb.drawRoundedRect(-1.4, -21.8, 4.1, 4.8, 1.2);
    chicken.comb.drawRoundedRect(2.8, -20.5, 4.1, 4, 1.2);
    chicken.comb.endFill();

    chicken.beak.clear();
    chicken.beak.lineStyle(1.5, 0xd88f2c, 1);
    chicken.beak.beginFill(0xf7bb58, 1);
    chicken.beak.moveTo(0, -8.2);
    chicken.beak.lineTo(-4.1, -4.4);
    chicken.beak.lineTo(4.1, -4.4);
    chicken.beak.closePath();
    chicken.beak.endFill();

    chicken.eye.clear();
    chicken.eye.beginFill(0x2a2a2a, 1);
    chicken.eye.drawRect(-4.1, -11.2, 2.2, 2.2);
    chicken.eye.drawRect(1.9, -11.2, 2.2, 2.2);
    chicken.eye.beginFill(0xffffff, 1);
    chicken.eye.drawRect(-3.3, -10.6, 0.7, 0.7);
    chicken.eye.drawRect(2.7, -10.6, 0.7, 0.7);
    chicken.eye.endFill();
  }

  private playChickenIdle(chicken: ChickenView): void {
    gsap.to(chicken.leftWing, {
      rotation: -0.56,
      duration: 0.26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(chicken.rightWing, {
      rotation: 0.56,
      duration: 0.26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(chicken.leftWing.scale, {
      x: 0.95,
      y: 0.95,
      duration: 0.26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(chicken.rightWing.scale, {
      x: 0.95,
      y: 0.95,
      duration: 0.26,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
}
