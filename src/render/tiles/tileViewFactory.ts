import * as PIXI from "pixi.js";
import type { BoardData } from "../../core/board";
import type { GoalView, TileView } from "../viewTypes";

export interface TileInteractionHandlers {
  onTap: (index: number) => void;
  onHover: (index: number) => void;
  onHoverOut: (index: number) => void;
}

export class TileViewFactory {
  private readonly createGoalView: () => GoalView;

  public constructor(createGoalView: () => GoalView) {
    this.createGoalView = createGoalView;
  }

  public create(
    board: BoardData,
    tileLayer: PIXI.Container,
    handlers: TileInteractionHandlers,
  ): TileView[] {
    return board.tiles.map((tile) => {
      const container = new PIXI.Container();
      container.eventMode = "static";
      container.cursor = "pointer";

      const shadow = new PIXI.Graphics();
      const body = new PIXI.Graphics();
      const glow = new PIXI.Graphics();

      const label = new PIXI.Text(`${tile.id}`, {
        fontFamily: "Space Grotesk, sans-serif",
        fontWeight: "700",
        fontSize: 24,
        fill: 0xeaf3ff,
      });
      label.anchor.set(0.5);

      const mineMark = new PIXI.Graphics();
      mineMark.visible = false;

      let goal: GoalView | null = null;
      if (tile.index === board.goalIndex) {
        goal = this.createGoalView();
      }

      container.addChild(shadow);
      container.addChild(body);
      container.addChild(glow);
      container.addChild(label);
      container.addChild(mineMark);
      if (goal) {
        container.addChild(goal.root);
      }

      container.on("pointertap", () => {
        handlers.onTap(tile.index);
      });

      container.on("pointerover", () => {
        handlers.onHover(tile.index);
      });

      container.on("pointerout", () => {
        handlers.onHoverOut(tile.index);
      });

      tileLayer.addChild(container);

      return {
        container,
        shadow,
        body,
        glow,
        label,
        mineMark,
        center: new PIXI.Point(),
        goal,
      };
    });
  }
}
