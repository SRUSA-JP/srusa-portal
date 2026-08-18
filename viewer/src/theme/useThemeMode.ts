import { useEffect, useState } from 'react';
import { DARK_THEME, LIGHT_THEME, type ThemeMode, type VizTheme } from './palette';

function detect(): ThemeMode {
  if (typeof document !== 'undefined') {
    const stamped = document.documentElement.dataset.theme;
    if (stamped === 'dark' || stamped === 'light') return stamped;
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** OS 設定と `<html data-theme>` の両方に追随するテーマ。 */
export function useVizTheme(): VizTheme {
  const [mode, setMode] = useState<ThemeMode>(detect);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setMode(detect());
    media.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      media.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
