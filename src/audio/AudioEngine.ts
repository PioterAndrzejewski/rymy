export type EngineState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

type Listener = (state: EngineState) => void;

export class AudioEngine {
  readonly el: HTMLAudioElement;
  private state: EngineState = 'idle';
  private listeners = new Set<Listener>();
  private lastObjectUrl: string | null = null;

  // Metronome-only mode: there is no audio element to read time from, so the
  // transport runs off a wall clock instead. Everything downstream (bar clock,
  // click driver, run views) keeps working unchanged.
  private virtual = false;
  private vOffsetMs = 0;
  private vStartedAt = 0;
  private vPlaying = false;

  constructor() {
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';

    this.el.addEventListener('playing', () => { if (!this.virtual) this.setState('playing'); });
    this.el.addEventListener('pause', () => {
      if (!this.virtual && this.state !== 'ended') this.setState('paused');
    });
    this.el.addEventListener('ended', () => { if (!this.virtual) this.setState('ended'); });
    this.el.addEventListener('error', () => { if (!this.virtual) this.setState('error'); });
  }

  private setState(s: EngineState) {
    this.state = s;
    this.listeners.forEach((l) => l(s));
  }

  getState(): EngineState { return this.state; }
  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }

  /** Switch to metronome-only: no file, transport driven by a wall clock. */
  loadClickOnly(): void {
    this.el.pause();
    this.el.removeAttribute('src');
    this.virtual = true;
    this.vOffsetMs = 0;
    this.vStartedAt = 0;
    this.vPlaying = false;
    this.setState('ready');
  }

  get isClickOnly(): boolean { return this.virtual; }

  async load(src: string, isObjectUrl = false): Promise<void> {
    this.virtual = false;
    this.setState('loading');
    if (this.lastObjectUrl) {
      URL.revokeObjectURL(this.lastObjectUrl);
      this.lastObjectUrl = null;
    }
    if (isObjectUrl) this.lastObjectUrl = src;
    this.el.src = src;
    await new Promise<void>((resolve, reject) => {
      const onReady = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('audio load failed')); };
      const cleanup = () => {
        this.el.removeEventListener('canplay', onReady);
        this.el.removeEventListener('error', onError);
      };
      this.el.addEventListener('canplay', onReady, { once: true });
      this.el.addEventListener('error', onError, { once: true });
      this.el.load();
    });
    this.setState('ready');
  }

  async play(): Promise<void> {
    if (this.virtual) {
      if (!this.vPlaying) { this.vStartedAt = performance.now(); this.vPlaying = true; }
      this.setState('playing');
      return;
    }
    await this.el.play();
  }

  pause(): void {
    if (this.virtual) {
      if (this.vPlaying) {
        this.vOffsetMs += performance.now() - this.vStartedAt;
        this.vPlaying = false;
      }
      this.setState('paused');
      return;
    }
    this.el.pause();
  }

  toggle(): void {
    if (this.virtual) {
      if (this.vPlaying) this.pause(); else void this.play();
      return;
    }
    if (this.el.paused) void this.play(); else this.pause();
  }

  seekMs(ms: number): void {
    if (this.virtual) {
      this.vOffsetMs = Math.max(0, ms);
      this.vStartedAt = performance.now();
      return;
    }
    this.el.currentTime = Math.max(0, ms / 1000);
  }

  get currentTimeMs(): number {
    if (this.virtual) {
      return this.vOffsetMs + (this.vPlaying ? performance.now() - this.vStartedAt : 0);
    }
    return this.el.currentTime * 1000;
  }

  get durationMs(): number {
    if (this.virtual) return 0;
    return isFinite(this.el.duration) ? this.el.duration * 1000 : 0;
  }

  setVolume(v: number): void { this.el.volume = Math.max(0, Math.min(1, v)); }
  setPlaybackRate(r: number): void { this.el.playbackRate = r; this.el.preservesPitch = false; }
}
