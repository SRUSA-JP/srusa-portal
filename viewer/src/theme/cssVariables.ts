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
 *
 * 最後に、そのページのスキン（config/skins.ts）による差し替えを重ねる。
 */
import { uiCssVariables } from '../config/colors';
import { DEFAULT_SKIN, skinCssVariables, type Skin } from '../config/skins';
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
 * スキンが指定する書体を読み込む。
 *
 * 同じ読み込み先を二重に足さない。読み込めない環境では、書体の指定に
 * 並べた代替の書体が使われる。
 */
function loadSkinFont(skin: Skin): void {
  const url = skin.font.url;
  if (!url || typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${url}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * 文書にテーマ・トークン・スキンを適用する。
 *
 * `color-scheme` も合わせて設定し、スクロールバーやフォーム部品の
 * 既定の見た目をテーマに追随させる。スキンの名前は `data-skin` として
 * 立てるので、CSS 側からも見た目を切り替えられる。
 */
export function applyDesignTokens(
  theme: VizTheme,
  skin: Skin = DEFAULT_SKIN,
  root: HTMLElement | null = document.documentElement,
): void {
  if (!root) return;
  loadSkinFont(skin);

  const variables = {
    ...tokenCssVariables(),
    ...themeCssVariables(theme),
    ...uiCssVariables(theme),
    ...skinCssVariables(skin),
  };
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  root.style.colorScheme = theme.mode;
  root.dataset.skin = skin.id;
}
