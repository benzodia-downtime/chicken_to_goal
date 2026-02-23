import { gsap } from "gsap";
import type { GamePhase } from "../core/gameState";
import type { StatusTone } from "./statusTone";

export interface SceneUiBindings {
  failOverlay: HTMLDivElement;
  failText: HTMLParagraphElement;
  winOverlay: HTMLDivElement;
  winText: HTMLParagraphElement;
  startOverlay: HTMLDivElement;
  routeButton: HTMLButtonElement;
  muteButton: HTMLButtonElement;
  masterVolumeInput: HTMLInputElement;
  masterVolumeValue: HTMLSpanElement;
  statusText: HTMLParagraphElement;
}

export class SceneUiController {
  private readonly ui: SceneUiBindings;

  public constructor(ui: SceneUiBindings) {
    this.ui = ui;
  }

  public setStatus(message: string, tone: StatusTone): void {
    this.ui.statusText.textContent = message;
    this.ui.statusText.classList.remove("win", "lose");

    if (tone === "win") {
      this.ui.statusText.classList.add("win");
      return;
    }

    if (tone === "lose") {
      this.ui.statusText.classList.add("lose");
    }
  }

  public updateStartOverlay(phase: GamePhase): void {
    const show = phase === "ready";
    this.ui.startOverlay.classList.toggle("hidden", !show);
  }

  public setFailOverlay(show: boolean): void {
    gsap.killTweensOf(this.ui.failOverlay);
    gsap.killTweensOf(this.ui.failText);

    if (!show) {
      this.ui.failOverlay.classList.add("hidden");
      this.ui.failOverlay.setAttribute("aria-hidden", "true");
      this.ui.failOverlay.style.opacity = "";
      this.ui.failText.style.opacity = "";
      this.ui.failText.style.transform = "";
      return;
    }

    this.ui.failOverlay.classList.remove("hidden");
    this.ui.failOverlay.setAttribute("aria-hidden", "false");
    gsap.set(this.ui.failOverlay, { opacity: 0 });
    gsap.set(this.ui.failText, {
      opacity: 0,
      scale: 10,
      transformOrigin: "50% 50%",
    });

    gsap.to(this.ui.failOverlay, {
      opacity: 1,
      duration: 0.15,
      ease: "power2.out",
    });
    gsap.to(this.ui.failText, {
      opacity: 1,
      scale: 1,
      duration: 0.15,
      ease: "power2.out",
    });
  }

  public setWinOverlay(show: boolean): void {
    gsap.killTweensOf(this.ui.winOverlay);
    gsap.killTweensOf(this.ui.winText);

    if (!show) {
      this.ui.winOverlay.classList.add("hidden");
      this.ui.winOverlay.setAttribute("aria-hidden", "true");
      this.ui.winOverlay.style.opacity = "";
      this.ui.winText.style.opacity = "";
      this.ui.winText.style.transform = "";
      return;
    }

    this.ui.winOverlay.classList.remove("hidden");
    this.ui.winOverlay.setAttribute("aria-hidden", "false");
    gsap.set(this.ui.winOverlay, { opacity: 0 });
    gsap.set(this.ui.winText, {
      opacity: 0,
      scale: 0.65,
      y: 14,
      transformOrigin: "50% 50%",
    });

    gsap.to(this.ui.winOverlay, {
      opacity: 1,
      duration: 0.22,
      ease: "power2.out",
    });
    gsap.to(this.ui.winText, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.24,
      ease: "back.out(1.4)",
    });
  }

  public setRouteButtonCollapsed(collapsed: boolean): void {
    this.ui.routeButton.classList.toggle("is-collapsed", collapsed);
    this.ui.routeButton.disabled = collapsed;
    this.ui.routeButton.tabIndex = collapsed ? -1 : 0;
    this.ui.routeButton.setAttribute("aria-hidden", String(collapsed));
  }

  public updateMuteButton(muted: boolean): void {
    this.ui.muteButton.textContent = muted ? "소리 켜기" : "소리 끄기";
    this.ui.muteButton.classList.toggle("muted", muted);
  }

  public syncMasterVolume(volume: number): void {
    const normalized = Math.max(0, Math.min(1, volume));
    this.ui.masterVolumeInput.value = normalized.toFixed(2);
    this.ui.masterVolumeValue.textContent = `${Math.round(normalized * 100)}%`;
  }

  public destroy(): void {
    gsap.killTweensOf(this.ui.failOverlay);
    gsap.killTweensOf(this.ui.failText);
    gsap.killTweensOf(this.ui.winOverlay);
    gsap.killTweensOf(this.ui.winText);
  }
}
