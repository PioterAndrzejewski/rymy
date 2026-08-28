import { useEffect, useState } from 'react';

/**
 * Telefon czy nie — decyduje o wysokości sceny 3D i o tym, ile efektów
 * rysujemy. Na telefonie scena jest niższa, bez cieni i gradientów: chodzi
 * o płynny spacer, nie o ładny render.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [breakpoint]);
  return mobile;
}
