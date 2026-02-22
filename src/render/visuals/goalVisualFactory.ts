import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import type { GoalLayout, GoalView } from "../viewTypes";

// Goal tile relative layout tuning.
// You can edit these offsets directly to move the pole/flag inside the number tile.
export const GOAL_LAYOUT: GoalLayout = {
  rootOffset: { x: 0, y: 4 },
  poleOffset: { x: 0, y: -25 },
  poleScale: { x: 0.5, y: 1.0 },
  flagOffset: { x: -0.5, y: -20 },
  flagScale: 1.3,
  labelOffset: { x: 0, y: 11.5 },
};

export class GoalVisualFactory {
  public create(): GoalView {
    const root = new PIXI.Container();
    const poleGroup = new PIXI.Container();
    const flagGroup = new PIXI.Container();
    const pole = new PIXI.Graphics();
    const flag = new PIXI.Graphics();
    const flagHighlight = new PIXI.Graphics();
    const sparkle = new PIXI.Graphics();
    const label = new PIXI.Text("GOAL", {
      fontFamily: "Archivo Black, sans-serif",
      fontSize: 10,
      fill: 0xffdf52,
      stroke: 0x6b4d00,
      strokeThickness: 2,
      letterSpacing: 0.6,
    });
    label.anchor.set(0.5);

    poleGroup.addChild(pole);
    flagGroup.addChild(flag);
    flagGroup.addChild(flagHighlight);

    root.addChild(poleGroup);
    root.addChild(flagGroup);
    root.addChild(sparkle);
    root.addChild(label);

    const goal = {
      root,
      poleGroup,
      flagGroup,
      pole,
      flag,
      flagHighlight,
      sparkle,
      label,
    };

    this.redraw(goal);
    goal.flagGroup.pivot.set(0, 5.6);
    goal.flagGroup.rotation = -0.03;
    goal.flagGroup.scale.set(GOAL_LAYOUT.flagScale);

    gsap.to(goal.flagGroup, {
      rotation: 0.055,
      duration: 0.58,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(goal.flagHighlight, {
      x: 0.9 * GOAL_LAYOUT.flagScale,
      duration: 0.58,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(goal.flagGroup.scale, {
      x: GOAL_LAYOUT.flagScale * 1.04,
      y: GOAL_LAYOUT.flagScale * 0.95,
      duration: 0.58,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    gsap.to(label, {
      alpha: 0.82,
      duration: 0.45,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    return goal;
  }

  public redraw(goal: GoalView): void {
    goal.poleGroup.position.set(GOAL_LAYOUT.poleOffset.x, GOAL_LAYOUT.poleOffset.y);
    goal.poleGroup.scale.set(GOAL_LAYOUT.poleScale.x, GOAL_LAYOUT.poleScale.y);
    goal.flagGroup.position.set(GOAL_LAYOUT.flagOffset.x, GOAL_LAYOUT.flagOffset.y);

    goal.pole.clear();
    goal.pole.lineStyle(2, 0x9b764f, 0.95);
    goal.pole.beginFill(0x6d5137, 0.98);
    goal.pole.drawRoundedRect(-2.2, 0, 4.4, 27.4, 2.1);
    goal.pole.endFill();

    goal.flag.clear();
    goal.flag.lineStyle(2, 0x8f1212, 0.98);
    goal.flag.beginFill(0xe63f3f, 1);
    goal.flag.moveTo(0, 0);
    goal.flag.lineTo(14.5, 2);
    goal.flag.lineTo(9.1, 5.6);
    goal.flag.lineTo(14.1, 9.2);
    goal.flag.lineTo(0, 11.1);
    goal.flag.closePath();
    goal.flag.endFill();

    goal.flagHighlight.clear();
    goal.flagHighlight.beginFill(0xff8f8f, 0.94);
    goal.flagHighlight.moveTo(1.7, 1.5);
    goal.flagHighlight.lineTo(10.4, 2.8);
    goal.flagHighlight.lineTo(6.4, 5.1);
    goal.flagHighlight.lineTo(10.2, 7.7);
    goal.flagHighlight.lineTo(1.7, 8.8);
    goal.flagHighlight.closePath();
    goal.flagHighlight.endFill();

    goal.sparkle.clear();
    goal.sparkle.lineStyle(1.2, 0xffd36b, 0.95);
    goal.sparkle.moveTo(-8.7, -18.8);
    goal.sparkle.lineTo(-6.6, -16.7);
    goal.sparkle.moveTo(-6.6, -18.8);
    goal.sparkle.lineTo(-8.7, -16.7);
    goal.sparkle.moveTo(11.4, -18.3);
    goal.sparkle.lineTo(13.5, -16.2);
    goal.sparkle.moveTo(13.5, -18.3);
    goal.sparkle.lineTo(11.4, -16.2);

    goal.label.position.set(GOAL_LAYOUT.labelOffset.x, GOAL_LAYOUT.labelOffset.y);
  }
}
