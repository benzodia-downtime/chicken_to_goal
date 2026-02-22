import { gsap } from "gsap";
import * as PIXI from "pixi.js";

export class VfxManager {
  private readonly active = new Set<PIXI.Graphics>();
  private readonly fxLayer: PIXI.Container;
  private readonly flashLayer: HTMLElement;

  public constructor(fxLayer: PIXI.Container, flashLayer: HTMLElement) {
    this.fxLayer = fxLayer;
    this.flashLayer = flashLayer;
  }

  public clear(): void {
    for (const graphic of this.active) {
      graphic.destroy();
    }
    this.active.clear();
    this.flashLayer.style.opacity = "0";
    gsap.killTweensOf(this.flashLayer);
  }

  public burst(
    x: number,
    y: number,
    color: number,
    count: number,
    speed = 72,
    spread = Math.PI * 2,
  ): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * spread + Math.random() * 0.16;
      const velocity = speed * (0.55 + Math.random() * 0.85);
      const distance = velocity * (0.18 + Math.random() * 0.01 * speed);
      const radius = 1.8 + Math.random() * 3.2;

      const particle = new PIXI.Graphics();
      particle.beginFill(color, 1);
      particle.drawCircle(0, 0, radius);
      particle.endFill();
      particle.position.set(x, y);
      this.fxLayer.addChild(particle);
      this.active.add(particle);

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      gsap.to(particle, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.48 + Math.random() * 0.32,
        ease: "power2.out",
        onComplete: () => {
          particle.destroy();
          this.active.delete(particle);
        },
      });

      gsap.to(particle.scale, {
        x: 0.2,
        y: 0.2,
        duration: 0.5 + Math.random() * 0.2,
        ease: "power2.out",
      });
    }
  }

  public ringPulse(x: number, y: number, color: number): void {
    const ring = new PIXI.Graphics();
    ring.lineStyle(4, color, 0.85);
    ring.drawCircle(0, 0, 10);
    ring.position.set(x, y);
    this.fxLayer.addChild(ring);
    this.active.add(ring);

    gsap.to(ring.scale, {
      x: 4.2,
      y: 4.2,
      duration: 0.46,
      ease: "power3.out",
    });

    gsap.to(ring, {
      alpha: 0,
      duration: 0.46,
      ease: "power3.out",
      onComplete: () => {
        ring.destroy();
        this.active.delete(ring);
      },
    });
  }

  public flash(color: string, peak = 0.76, duration = 0.4): void {
    this.flashLayer.style.background = `radial-gradient(circle at center, ${color}, transparent 72%)`;
    gsap.killTweensOf(this.flashLayer);
    gsap.fromTo(
      this.flashLayer,
      { opacity: peak },
      { opacity: 0, duration, ease: "power2.out" },
    );
  }

  public shake(target: PIXI.Container, intensity = 8, duration = 0.32): void {
    const baseX = target.x;
    const baseY = target.y;
    const steps = Math.max(5, Math.floor(duration * 30));
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      onComplete: () => {
        target.position.set(baseX, baseY);
      },
    });

    for (let i = 0; i < steps; i += 1) {
      tl.to(target, {
        x: baseX + randomRange(-intensity, intensity),
        y: baseY + randomRange(-intensity, intensity),
        duration: duration / steps,
      });
    }
  }
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
