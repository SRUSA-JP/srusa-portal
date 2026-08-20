/**
 * 色の割り当て。
 *
 * 「どの部品にどの色を使うか」は、この 1 ファイルだけが決める。
 * グラフの軸・棒・点も、プルダウンやボタンといった画面部品も、
 * ここの 1 行を書き換えれば全画面の色が変わる。
 *
 * 色そのもの（実際の色コード）とコントラストの計算は theme/palette.ts。
 * このファイルは palette が用意した色を部品に結びつけるだけで、
 * 色コードを持たない。
 *
 * - グラフ・相関図 → `figureColors()` が返す色をコンポーネントが使う
 * - 画面部品      → `uiCssVariables()` が CSS カスタムプロパティとして流し込む
 */
import {
  CONTRAST_MIN_TEXT,
  chartText,
  colorScale,
  cursorFill,
  mutedFill,
  readableTextOn,
  tooltipSurface,
  type TooltipSurfaceStyle,
  type VizTheme,
} from '../theme/palette';

/**
 * カテゴリ配色の使い方。
 *
 * 系列が 1 つのグラフや強調表示は、毎回同じスロットを使って色を固定する。
 * ランキング順で色を付け替えない（色は実体に固定する）。
 */
export const COLOR_SLOTS = {
  /** 単一系列のグラフ・強調表示。 */
  primary: 0,
} as const;

/* ------------------------------------------------------------------ *
 * 図（グラフ・相関図）の色
 * ------------------------------------------------------------------ */

export interface FigureColors {
  /** 軸・目盛り・凡例・データラベルの文字。 */
  axis: string;
  /** 主役の文字（強調した要素のラベル）。 */
  strongText: string;
  /** 目盛り線・軸線。 */
  grid: string;
  /** ホバー中のカテゴリを示す薄い帯。 */
  cursor: string;
  /** 単一系列の塗り・強調。 */
  primary: string;
  /** 対象から外した要素。 */
  dimmed: string;
  /**
   * 図の下地。文字色のコントラストはこの面を基準に判定する。
   * 記事に埋め込んだときは記事の地の色になる。
   */
  background: string;
  /**
   * 図形どうしを切り分ける線（積み上げの隙間・点や線の縁取り）。
   * 下地と同じ色で描くことで、隣り合う図形の境目を作る。
   */
  separator: string;
  /** 系列キー → 色。登録順で固定するので、絞り込んでも色が変わらない。 */
  series: (keys: string[]) => (key: string) => string;
  /** 分類ごとのスロット色（相関図のグループなど）。 */
  slot: (index: number) => string;
  /** 色の面の上に載せる文字・図形。読める色まで寄せて返す。 */
  labelOn: (background: string, minRatio?: number) => string;
  /** ツールチップの面。 */
  tooltip: TooltipSurfaceStyle;
}

/**
 * 図の各部の色。
 *
 * コンポーネントはここが返した色だけを使い、テーマの色を直接読まない。
 */
export function figureColors(theme: VizTheme): FigureColors {
  return {
    axis: chartText(theme),
    strongText: chartText(theme, 'primary'),
    grid: theme.grid,
    cursor: cursorFill(theme),
    primary: theme.categorical[COLOR_SLOTS.primary % theme.categorical.length],
    dimmed: mutedFill(theme),
    background: theme.surface,
    separator: theme.surface,
    series: (keys) => colorScale(keys, theme),
    slot: (index) => theme.categorical[index % theme.categorical.length],
    labelOn: (background, minRatio = CONTRAST_MIN_TEXT) => readableTextOn(background, theme, minRatio),
    tooltip: tooltipSurface(theme),
  };
}

/* ------------------------------------------------------------------ *
 * 画面部品の色
 * ------------------------------------------------------------------ */

/**
 * 部品ごとの色を CSS カスタムプロパティにする。
 *
 * styles.css はここで作られた名前だけを使う（生の配色 `--color-*` は使わない）。
 * プルダウンやボタンの色を変えたいときは、この表の該当行を書き換える。
 */
export function uiCssVariables(theme: VizTheme): Record<string, string> {
  return {
    /* ページ全体 */
    '--page-background': theme.background,
    '--page-text': theme.textPrimary,
    /* 補足・注記の文字 */
    '--muted-text': theme.textSecondary,
    /* 区切り線 */
    '--divider': theme.border,
    /* エラー表示 */
    '--error-text': theme.danger,

    /* 操作部品（プルダウン・ボタン・数値入力） */
    '--control-background': theme.surfaceRaised,
    '--control-text': theme.textPrimary,
    '--control-border': theme.border,
    /* ポインタを載せたとき */
    '--control-border-hover': theme.accent,
    /* 選択中（タブ・切り替えボタン） */
    '--control-selected': theme.accent,
    '--control-selected-text': readableTextOn(theme.accent, theme, CONTRAST_MIN_TEXT),
    /* キーボード操作の位置表示 */
    '--focus-ring': theme.accent,

    /* 表 */
    '--table-border': theme.border,
    '--table-header-background': theme.surface,
    '--table-header-text': theme.textSecondary,

    /* 相関図の凡例 */
    '--legend-background': theme.surfaceRaised,
    '--legend-border': theme.border,
    '--legend-active-border': theme.accent,
  };
}
