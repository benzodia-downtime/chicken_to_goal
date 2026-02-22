import * as PIXI from "pixi.js";

export function destroyChildren(container: PIXI.Container): void {
  const children = container.removeChildren();
  for (const child of children) {
    child.destroy();
  }
}
