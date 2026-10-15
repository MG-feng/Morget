class FrameScheduler {
  private targetFps = 0;
  private lastTick = 0;

  setFps(fps: number): void {
    this.targetFps = fps <= 0 ? 0 : Math.min(Math.floor(fps), 240);
  }

  start(): void {
    const loop = (t: number): void => {
      requestAnimationFrame(loop);

      if (this.targetFps === 0 || t - this.lastTick >= 1000 / this.targetFps) {
        this.lastTick = t;
        window.dispatchEvent(new CustomEvent("morget:frame", { detail: t }));
      }
    };

    requestAnimationFrame(loop);
  }
}

export const frameScheduler = new FrameScheduler();
