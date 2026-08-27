// Minimal WebAudio click. Triggered on beat-change detection from rAF.
// Jitter is ~1 frame (~16 ms) — good enough for practice at slow tempi;
// we can move to lookahead scheduling later once time-stretch matures.

let ctx: AudioContext | null = null;
function context(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playClick(opts: { accent?: boolean; volume?: number } = {}) {
  const { accent = false, volume = 0.5 } = opts;
  const c = context();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.value = accent ? 1500 : 900;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

/** Two-note chime — end of a timer or of an exercise. */
export function playChime(volume = 0.3) {
  const c = context();
  const now = c.currentTime;
  for (const [f, t] of [[880, 0], [1320, 0.15]] as const) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(volume, now + t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.5);
  }
}
