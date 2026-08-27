import { useEffect, useRef } from 'react';
import type { Track } from '@/types';
import { engine } from './engineSingleton';
import { computeTransport } from './transport';
import { playClick } from './click';
import { loadSettings, type Settings } from '@/storage/settings';

const SETTINGS_REFRESH_MS = 250;

// Fires a click when we cross into a new beat while playing.
// Accent on the downbeat (beat 0). Settings are re-read a few times a second so
// toggling the metronome in the UI takes effect without prop plumbing — but not
// on every frame, which would mean a localStorage read + JSON.parse per frame.
export function useClickDriver(track: Track | null) {
  const lastBar = useRef(-2);
  const lastBeat = useRef(-2);

  useEffect(() => {
    if (!track) return;
    let raf = 0;
    let settings: Settings = loadSettings();
    let lastSettingsRead = performance.now();

    const tick = () => {
      const now = performance.now();
      if (now - lastSettingsRead > SETTINGS_REFRESH_MS) {
        settings = loadSettings();
        lastSettingsRead = now;
      }
      if (engine.getState() === 'playing' && settings.clickEnabled) {
        const snap = computeTransport(engine.currentTimeMs, track);
        if (snap.bar >= 0 && (snap.bar !== lastBar.current || snap.beat !== lastBeat.current)) {
          if (lastBar.current !== -2) {
            playClick({ accent: snap.beat === 0, volume: settings.clickVolume });
          }
          lastBar.current = snap.bar;
          lastBeat.current = snap.beat;
        }
      } else {
        lastBar.current = -2;
        lastBeat.current = -2;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track]);
}
