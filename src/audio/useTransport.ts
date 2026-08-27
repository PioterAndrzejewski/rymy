import { useEffect, useState } from 'react';
import type { Track, TransportSnapshot } from '@/types';
import { computeTransport } from './transport';
import { engine } from './engineSingleton';

export function useTransport(track: Track | null): TransportSnapshot {
  const [snap, setSnap] = useState<TransportSnapshot>({
    timeMs: 0, bar: -1, beat: -1, barPhase: 0,
  });

  useEffect(() => {
    if (!track) return;
    let raf = 0;
    const tick = () => {
      setSnap(computeTransport(engine.currentTimeMs, track));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track]);

  return snap;
}

export function useEngineState() {
  const [state, setState] = useState(engine.getState());
  useEffect(() => engine.subscribe(setState), []);
  return state;
}
