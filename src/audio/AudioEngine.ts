export type EngineState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

type Listener = (state: EngineState) => void;

export class AudioEngine {
  readonly el: HTMLAudioElement;
  private state: EngineState = 'idle';
  private listeners = new Set<Listener>();
  private lastObjectUrl: string | null = null;

  constructor() {
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';

    this.el.addEventListener('playing', () => this.setState('playing'));
    this.el.addEventListener('pause', () => {
      if (this.state !== 'ended') this.setState('paused');
    });
    this.el.addEventListener('ended', () => this.setState('ended'));
    this.el.addEventListener('error', () => this.setState('error'));
  }

  private setState(s: EngineState) {
    this.state = s;
    this.listeners.forEach((l) => l(s));
  }

  getState(): EngineState { return this.state; }
  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }

  async load(src: string, isObjectUrl = false): Promise<void> {
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

  async play(): Promise<void> { await this.el.play(); }
  pause(): void { this.el.pause(); }
  toggle(): void { if (this.el.paused) void this.play(); else this.pause(); }
  seekMs(ms: number): void { this.el.currentTime = Math.max(0, ms / 1000); }

  get currentTimeMs(): number { return this.el.currentTime * 1000; }
  get durationMs(): number { return isFinite(this.el.duration) ? this.el.duration * 1000 : 0; }

  setVolume(v: number): void { this.el.volume = Math.max(0, Math.min(1, v)); }
  setPlaybackRate(r: number): void { this.el.playbackRate = r; this.el.preservesPitch = false; }
}
