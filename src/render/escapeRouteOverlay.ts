import * as PIXI from "pixi.js";
import type { BoardData } from "../core/board";
import { findShortestPath } from "../core/rules";
import { destroyChildren } from "./pixiChildren";
import type { TileView } from "./viewTypes";

export class EscapeRouteOverlay {
  private readonly layer: PIXI.Container;

  public constructor(layer: PIXI.Container) {
    this.layer = layer;
  }

  public show(board: BoardData, tileViews: TileView[]): number[] | null {
    const route = this.computeRoute(board);
    this.clear();
    if (route && route.length >= 2) {
      this.draw(route, tileViews);
    }
    return route;
  }

  public redraw(board: BoardData, tileViews: TileView[]): void {
    if (this.layer.children.length === 0) {
      return;
    }

    const route = this.computeRoute(board);
    this.clear();
    if (route && route.length >= 2) {
      this.draw(route, tileViews);
    }
  }

  public clear(): void {
    destroyChildren(this.layer);
  }

  private computeRoute(board: BoardData): number[] | null {
    return findShortestPath(
      board.startIndex,
      board.goalIndex,
      board.cols,
      board.rows,
      board.mineSet,
    );
  }

  private draw(route: number[], tileViews: TileView[]): void {
    const line = new PIXI.Graphics();
    line.lineStyle(8, 0x53ffe1, 0.14, 0.5);
    this.traceLine(line, route, tileViews);
    line.lineStyle(3.5, 0x9afff0, 0.95, 0.5);
    this.traceLine(line, route, tileViews);
    this.layer.addChild(line);

    for (let i = 0; i < route.length; i += 1) {
      const idx = route[i];
      const center = tileViews[idx].center;
      const node = new PIXI.Graphics();
      const radius = i === 0 || i === route.length - 1 ? 5.4 : 4.2;
      const fill = i === route.length - 1 ? 0xffde8f : 0x8affdd;
      node.beginFill(fill, 0.98);
      node.drawCircle(0, 0, radius);
      node.endFill();
      node.position.set(center.x, center.y);
      this.layer.addChild(node);
    }
  }

  private traceLine(
    line: PIXI.Graphics,
    route: number[],
    tileViews: TileView[],
  ): void {
    line.moveTo(tileViews[route[0]].center.x, tileViews[route[0]].center.y);
    for (let i = 1; i < route.length; i += 1) {
      const point = tileViews[route[i]].center;
      line.lineTo(point.x, point.y);
    }
  }
}
