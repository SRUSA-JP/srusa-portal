/**
 * 色以外のデザイントークン（書体・余白・角丸・寸法）。
 *
 * 画面に出る数値と書体はここだけが持つ。CSS もコンポーネントも、
 * このファイルから作られたカスタムプロパティを参照する。
 * 色は theme/palette.ts が持つ（役割を分けて、どちらも単一の出どころにする）。
 */

/** 書体。 */
export const FONT = {
  /** 本文と UI の書体。 */
  family:
    "system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
  /** 数字を並べて比べる箇所（表・グラフの値）。 */
  familyNumeric:
    "ui-monospace, SFMono-Regular, Menlo, 'Hiragino Sans', 'Noto Sans JP', monospace",
  size: {
    /** 補足・注記。 */
    xs: '11px',
    /** ラベル・凡例。 */
    sm: '12px',
    /** 表・小見出し。 */
    md: '13px',
    /** 本文。 */
    base: '14px',
    /** カード見出し。 */
    lg: '15px',
    /** 画面見出し。 */
    xl: '20px',
    /** 指標の数値。 */
    display: '22px',
  },
  weight: {
    normal: '400',
    medium: '600',
    bold: '650',
  },
  lineHeight: {
    tight: '1.3',
    base: '1.6',
  },
  letterSpacing: {
    tight: '-0.01em',
    base: '0',
  },
} as const;

/** 余白。 */
export const SPACE = {
  none: '0',
  xxs: '2px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '20px',
  xxxl: '24px',
  page: '64px',
} as const;

/** 角丸。 */
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  pill: '999px',
} as const;

/** 線の太さ。 */
export const BORDER = {
  hairline: '1px',
  thick: '2px',
} as const;

/** 画面の寸法。 */
export const LAYOUT = {
  /** 本文の最大幅。 */
  maxWidth: '1180px',
  /** 指標タイルの最小幅（この幅を下回ると折り返す）。 */
  tileMinWidth: '170px',
  /** 2 段組みの最小幅。 */
  columnMinWidth: '420px',
  /** 表を縦スクロールさせる高さ。 */
  tableMaxHeight: '520px',
  /** 数値入力欄の幅。 */
  numberInputWidth: '7em',
  /** アイコンなどの小さな四角。 */
  swatchSize: '12px',
} as const;

/** 状態を表す効果。 */
export const EFFECT = {
  /** 押せないボタンの薄さ。 */
  disabledOpacity: '0.5',
} as const;

/** 平坦なキーと CSS カスタムプロパティ名の対応を作る。 */
function flatten(prefix: string, source: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [`--${prefix}-${kebab(key)}`, value]));
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * トークンを CSS カスタムプロパティの一覧にする。
 * CSS 側はここで作られた名前だけを使う。
 */
export function tokenCssVariables(): Record<string, string> {
  return {
    '--font-family': FONT.family,
    '--font-family-numeric': FONT.familyNumeric,
    ...flatten('font-size', FONT.size),
    ...flatten('font-weight', FONT.weight),
    ...flatten('line-height', FONT.lineHeight),
    ...flatten('letter-spacing', FONT.letterSpacing),
    ...flatten('space', SPACE),
    ...flatten('radius', RADIUS),
    ...flatten('border', BORDER),
    ...flatten('layout', LAYOUT),
    ...flatten('effect', EFFECT),
  };
}
