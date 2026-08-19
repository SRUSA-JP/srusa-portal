import { useEffect, useState } from 'react';
import { applyDesignTokens } from './cssVariables';
import { hostTheme, observeHostTheme } from './hostTheme';
import { DARK_THEME, LIGHT_THEME, type ThemeMode, type VizTheme } from './palette';

/** 埋め込み先の指定を最優先し、無ければ OS 設定に従う。 */
function detect(): ThemeMode {
  const host = hostTheme();
  if (host) return host;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * 表示中のテーマ。
 *
 * 埋め込み先（MkDocs ページ）のナイトモード切り替え、OS の配色設定、
 * どちらの変化にも追随する。色とトークンは CSS カスタムプロパティとしても
 * 流し込むので、CSS 側に実値を書く必要がない。
 */
export function useVizTheme(): VizTheme {
  const [mode, setMode] = useState<ThemeMode>(detect);

  useEffect(() => {
    const update = () => setMode(detect());
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    const stopObserving = observeHostTheme(update);
    /* 埋め込み先の読み込み順によっては初回検出が早すぎるので、一度だけ取り直す */
    update();
    return () => {
      media.removeEventListener('change', update);
      stopObserving();
    };
  }, []);

  const theme = mode === 'dark' ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    applyDesignTokens(theme);
  }, [theme]);

  return theme;
}
