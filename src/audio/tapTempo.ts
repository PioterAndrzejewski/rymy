// Simple tap-tempo: keep last N tap timestamps, return mean-interval bpm.
// Reset if a tap arrives after > resetAfterMs.

export class TapTempo {
  private taps: number[] = [];
  constructor(private maxTaps = 8, private resetAfterMs = 2000) {}

  tap(now = performance.now()): number | null {
    const last = this.taps[this.taps.length - 1];
    if (last !== undefined && now - last > this.resetAfterMs) this.taps = [];
    this.taps.push(now);
    if (this.taps.length > this.maxTaps) this.taps.shift();
    if (this.taps.length < 2) return null;
    const intervals = this.taps.slice(1).map((t, i) => t - this.taps[i]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // one decimal — backing tracks are rarely exactly on a whole BPM
    return Math.round(600000 / mean) / 10;
  }

  reset() { this.taps = []; }
}
