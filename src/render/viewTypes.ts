import * as PIXI from "pixi.js";

export interface ChickenView {
  root: PIXI.Container;
  body: PIXI.Graphics;
  leftWing: PIXI.Container;
  rightWing: PIXI.Container;
  leftWingShape: PIXI.Graphics;
  rightWingShape: PIXI.Graphics;
  head: PIXI.Graphics;
  comb: PIXI.Graphics;
  beak: PIXI.Graphics;
  eye: PIXI.Graphics;
  feet: PIXI.Graphics;
  tail: PIXI.Graphics;
}

export interface PlayerView {
  shadow: PIXI.Graphics;
  root: PIXI.Container;
  chicken: ChickenView;
  hookLine: PIXI.Graphics;
  hookHead: PIXI.Graphics;
  clawBridge: PIXI.Graphics;
  leftClaw: PIXI.Graphics;
  rightClaw: PIXI.Graphics;
}

export interface GoalView {
  root: PIXI.Container;
  poleGroup: PIXI.Container;
  flagGroup: PIXI.Container;
  pole: PIXI.Graphics;
  flag: PIXI.Graphics;
  flagHighlight: PIXI.Graphics;
  sparkle: PIXI.Graphics;
  label: PIXI.Text;
}

export interface TileView {
  container: PIXI.Container;
  shadow: PIXI.Graphics;
  body: PIXI.Graphics;
  glow: PIXI.Graphics;
  label: PIXI.Text;
  mineMark: PIXI.Graphics;
  center: PIXI.Point;
  goal: GoalView | null;
}

export interface TileStyle {
  fill: number;
  fillAlpha: number;
  stroke: number;
  glowColor: number;
  glowAlpha: number;
  labelTint: number;
  labelAlpha: number;
  mineVisible: boolean;
  pulseScale: number;
}

export interface GoalLayout {
  rootOffset: { x: number; y: number };
  poleOffset: { x: number; y: number };
  poleScale: { x: number; y: number };
  flagOffset: { x: number; y: number };
  flagScale: number;
  labelOffset: { x: number; y: number };
}
