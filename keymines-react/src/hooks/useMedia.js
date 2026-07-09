import { useEffect, useState } from 'react';

/** Match a CSS media query; updates on resize / orientation change. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsTouch() {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)');
}

/** Phones / tablets — reduce 3D cost (static keys, no shadows, lower DPR). */
export function useLowPower() {
  return useMediaQuery('(max-width: 768px), (hover: none) and (pointer: coarse)');
}
