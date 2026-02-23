import { gsap } from "gsap";
import * as PIXI from "pixi.js";
import type { BoardData } from "../../core/board";
import type { GameState } from "../../core/gameState";
import { canMoveTo } from "../../core/rules";
import { destroyChildren } from "../pixiChildren";
import type { TileStyle, TileView } from "../viewTypes";

export interface TileRenderContext {
  board: BoardData;
  state: GameState;
  tileViews: TileView[];
  revealMines: boolean;
  hoverIndex: number | null;
  tileSize: number;
}

export class TileRenderSystem {
  public clearContainer(container: PIXI.Container): void {
    destroyChildren(container);
  }

  public renderAllTiles(
    context: TileRenderContext,
    guideLayer: PIXI.Container,
  ): void {
    for (const tile of context.board.tiles) {
      this.renderTile(context, tile.index);
    }
    this.renderMoveGuides(context, guideLayer);
  }

  public renderTile(context: TileRenderContext, index: number): void {
    const style = this.resolveTileStyle(context, index);
    const view = context.tileViews[index];
    const corner = 8;
    const tileSize = context.tileSize;

    view.shadow.clear();
    view.shadow.beginFill(0x000000, 0.22);
    view.shadow.drawRoundedRect(3, 5, tileSize - 6, tileSize - 6, corner);
    view.shadow.endFill();

    view.body.clear();
    view.body.lineStyle(2, style.stroke, 0.95);
    view.body.beginFill(style.fill, style.fillAlpha);
    view.body.drawRoundedRect(0, 0, tileSize, tileSize, corner);
    view.body.endFill();

    view.glow.clear();
    if (style.glowAlpha > 0) {
      view.glow.lineStyle(4, style.glowColor, style.glowAlpha);
      view.glow.drawRoundedRect(-2, -2, tileSize + 4, tileSize + 4, corner + 1);
    }

    view.label.tint = style.labelTint;
    view.label.alpha = style.labelAlpha;
    view.mineMark.visible = style.mineVisible;

    gsap.to(view.container.scale, {
      x: style.pulseScale,
      y: style.pulseScale,
      duration: 0.14,
      overwrite: true,
      ease: "power2.out",
    });
  }

  public renderMoveGuides(
    context: TileRenderContext,
    guideLayer: PIXI.Container,
  ): void {
    this.clearContainer(guideLayer);

    if (context.state.phase !== "playing") {
      return;
    }

    const from = context.tileViews[context.state.currentIndex].center;
    for (const tile of context.board.tiles) {
      if (tile.index === context.state.currentIndex) {
        continue;
      }

      if (!canMoveTo(context.board, context.state, tile.index)) {
        continue;
      }

      const to = context.tileViews[tile.index].center;
      const isHover = context.hoverIndex === tile.index;
      const line = new PIXI.Graphics();
      line.lineStyle(isHover ? 4 : 2, isHover ? 0x9bfff0 : 0x7faee0, isHover ? 0.52 : 0.22, 0.5);
      line.moveTo(from.x, from.y);
      line.lineTo(to.x, to.y);
      guideLayer.addChild(line);
    }
  }

  public redrawMineMark(mineMark: PIXI.Graphics, tileSize: number): void {
    const bodyRadius = Math.max(11, tileSize * 0.23);
    const spikeStart = bodyRadius * 0.9;
    const spikeEnd = bodyRadius + Math.max(5.5, bodyRadius * 0.42);

    mineMark.clear();
    mineMark.lineStyle(2.4, 0x101010, 1);
    mineMark.beginFill(0x050505, 1);
    mineMark.drawCircle(0, 0, bodyRadius);
    mineMark.endFill();

    mineMark.beginFill(0x2a2a2a, 0.9);
    mineMark.drawCircle(-bodyRadius * 0.34, -bodyRadius * 0.34, bodyRadius * 0.26);
    mineMark.endFill();

    mineMark.lineStyle(2, 0x121212, 1);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      mineMark.moveTo(Math.cos(angle) * spikeStart, Math.sin(angle) * spikeStart);
      mineMark.lineTo(Math.cos(angle) * spikeEnd, Math.sin(angle) * spikeEnd);
    }

    mineMark.lineStyle(2.2, 0x171717, 1);
    mineMark.moveTo(bodyRadius * 0.25, -bodyRadius * 0.75);
    mineMark.lineTo(bodyRadius * 0.62, -bodyRadius * 1.33);
    mineMark.beginFill(0xffbf6e, 0.96);
    mineMark.drawCircle(bodyRadius * 0.73, -bodyRadius * 1.46, 2.2);
    mineMark.endFill();
  }

  private resolveTileStyle(context: TileRenderContext, index: number): TileStyle {
    const tile = context.board.tiles[index];
    const isCurrent = index === context.state.currentIndex;
    const isVisitedSafe = context.state.visitedSafe.has(index);
    const isClear = context.state.phase === "clear";
    const isGoal = index === context.board.goalIndex;
    const isMineVisible = context.revealMines && tile.isMine;
    const isHover = context.hoverIndex === index;
    const canStepHere = canMoveTo(context.board, context.state, index);

    if (isMineVisible) {
      return {
        fill: 0x4b151e,
        fillAlpha: 0.95,
        stroke: 0xff6c82,
        glowColor: 0xff8094,
        glowAlpha: isCurrent ? 0.34 : 0.16,
        labelTint: 0xffd5db,
        labelAlpha: 0.14,
        mineVisible: true,
        pulseScale: isCurrent ? 1.05 : 1,
      };
    }

    if (isClear && isVisitedSafe) {
      return {
        fill: 0x4b7a5f,
        fillAlpha: 0.95,
        stroke: 0xa0c8ae,
        glowColor: 0x8ec2a4,
        glowAlpha: isCurrent ? 0.16 : 0.08,
        labelTint: 0x143624,
        labelAlpha: 0.96,
        mineVisible: false,
        pulseScale: isCurrent ? 1.01 : 1,
      };
    }

    if (isCurrent) {
      return {
        fill: 0x1f8e57,
        fillAlpha: 0.56,
        stroke: 0x79d39d,
        glowColor: 0x8ee7b3,
        glowAlpha: 0.16,
        labelTint: 0xdaf7e7,
        labelAlpha: 0.9,
        mineVisible: false,
        pulseScale: 1.02,
      };
    }

    if (isGoal) {
      return {
        fill: isVisitedSafe ? 0x9b7120 : 0x3f351f,
        fillAlpha: 0.95,
        stroke: 0xffd783,
        glowColor: 0xffe7a9,
        glowAlpha: canStepHere ? 0.36 : 0.18,
        labelTint: 0xffefbf,
        labelAlpha: 0,
        mineVisible: false,
        pulseScale: 1,
      };
    }

    if (isVisitedSafe) {
      return {
        fill: 0x1ad85f,
        fillAlpha: 0.95,
        stroke: 0xb6ffc6,
        glowColor: 0x83ff9a,
        glowAlpha: 0.2,
        labelTint: 0x06311b,
        labelAlpha: 1,
        mineVisible: false,
        pulseScale: 1,
      };
    }

    const isSelectable = context.state.phase === "playing" && canStepHere;
    const glow = isSelectable ? (isHover ? 0.34 : 0.18) : 0;

    return {
      fill: isSelectable ? 0x1a2f4e : 0x0f1a2c,
      fillAlpha: 0.95,
      stroke: isSelectable ? 0x4b6e9f : 0x2a3c59,
      glowColor: 0x89ffea,
      glowAlpha: glow,
      labelTint: isSelectable ? 0xe7f1ff : 0xa7bbd6,
      labelAlpha: isSelectable ? 1 : 0.78,
      mineVisible: false,
      pulseScale: isHover ? 1.03 : 1,
    };
  }
}
