/**
 * テーマとトークンを CSS カスタムプロパティとして流し込む。
 *
 * CSS 側に色・書体・寸法の実値を書かないための橋渡し。
 * ここを通した値だけが styles.css から参照できる。
 *
 * 色は 2 段階で流し込む。
 *   `--color-*`  : 生の配色（theme/palette.ts の値そのもの）
 *   部品ごとの名前: どの部品に何色を使うかの割り当て（config/colors.ts）
 * styles.css が使うのは後者だけで、生の配色は直接使わない。
 */
import { uiCssVariables } from '../config/colors';
import { CONTRAST_MIN_TEXT, readableTextOn, type VizTheme } from './palette';
import { tokenCssVariables } from './tokens';

/** テーマの色を CSS カスタムプロパティ名に対応させる。 */
export function themeCssVariables(theme: VizTheme): Record<string, string> {
  const variables: Record<string, string> = {
    '--color-background': theme.background,
    '--color-surface': theme.surface,
    '--color-surface-raised': theme.surfaceRaised,
    '--color-border': theme.border,
    '--color-text-primary': theme.textPrimary,
    '--color-text-secondary': theme.textSecondary,
    '--color-accent': theme.accent,
    '--color-danger': theme.danger,
    '--color-grid': theme.grid,
    /* 強調色の上に載る文字。コントラストを満たす色を計算して渡す */
    '--color-on-accent': readableTextOn(theme.accent, theme, CONTRAST_MIN_TEXT),
  };
  theme.categorical.forEach((color, index) => {
    variables[`--color-categorical-${index + 1}`] = color;
  });
  return variables;
}

/**
 * 文書にテーマとトークンを適用する。
 *
 * `color-scheme` も合わせて設定し、スクロールバーやフォーム部品の
 * 既定の見た目をテーマに追随させる。
 */
export function applyDesignTokens(theme: VizTheme, root: HTMLElement | null = document.documentElement): void {
  if (!root) return;
  const variables = {
    ...tokenCssVariables(),
    ...themeCssVariables(theme),
    ...uiCssVariables(theme),
  };
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  root.style.colorScheme = theme.mode;
}
