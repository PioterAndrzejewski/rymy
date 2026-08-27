import { useEffect, useRef, useState } from 'react';

/**
 * rAF countdown. Returns remaining ms and fires `onDone` once when it hits 0.
 * Pass totalMs = 0 to disable (remaining stays 0 and onDone never fires).
 */
export function useCountdown(totalMs: number, active: boolean, onDone: () => void): number {
  const [remaining, setRemaining] = useState(totalMs);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setRemaining(totalMs);
    if (!active || totalMs <= 0) return;
    const start = performance.now();
    let raf = 0;
    let fired = false;
    const tick = () => {
      const left = Math.max(0, totalMs - (performance.now() - start));
      setRemaining(left);
      if (left <= 0) {
        if (!fired) { fired = true; doneRef.current(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, totalMs]);

  return remaining;
}
