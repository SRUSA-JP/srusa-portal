import { useEffect, useMemo, useState } from 'react';
import { activeSkin, applySkin } from '../config/skins';
import { hostBackgroundColor } from '../embed';
import { applyDesignTokens } from './cssVariables';
import { hostTheme, observeHostTheme } from './hostTheme';
import { DARK_THEME, LIGHT_THEME, type ThemeMode, type VizTheme } from './palette';

/** 埋め込み先の配色が切り替わったあと、色が落ち着くまでの待ち時間（ミリ秒）。 */
const HOST_COLOR_SETTLE_MS = 400;

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
 * どちらの変化にも追随する。記事に埋め込まれているときは地の色も
 * 埋め込み先から借りて、グラフの面だけ色が違って見えないようにする。
 * そのページのスキン（config/skins.ts）による色の差し替えもここで重ねる。
 * 色とトークンは CSS カスタムプロパティとしても流し込むので、
 * CSS 側に実値を書く必要がない。
 */
export function useVizTheme(): VizTheme {
  const [mode, setMode] = useState<ThemeMode>(detect);
  const [hostBackground, setHostBackground] = useState<string | null>(hostBackgroundColor);

  useEffect(() => {
    let settle: ReturnType<typeof setTimeout>;
    const update = () => {
      setMode(detect());
      setHostBackground(hostBackgroundColor());
      /* 埋め込み先は配色を滑らかに切り替えるので、途中の色を掴まないよう取り直す */
      clearTimeout(settle);
      settle = setTimeout(() => setHostBackground(hostBackgroundColor()), HOST_COLOR_SETTLE_MS);
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    const stopObserving = observeHostTheme(update);
    /* 埋め込み先の読み込み順によっては初回検出が早すぎるので、一度だけ取り直す */
    update();
    return () => {
      clearTimeout(settle);
      media.removeEventListener('change', update);
      stopObserving();
    };
  }, []);

  const skin = activeSkin();
  const theme = useMemo<VizTheme>(() => {
    const base = applySkin(mode === 'dark' ? DARK_THEME : LIGHT_THEME, skin);
    if (!hostBackground) return base;
    return { ...base, background: hostBackground, surface: hostBackground };
  }, [mode, hostBackground, skin]);

  useEffect(() => {
    applyDesignTokens(theme, skin);
  }, [theme, skin]);

  return theme;
}
