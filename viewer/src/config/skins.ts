/**
 * 見た目のプリセット（スキン）。
 *
 * 「どのページをどんな見た目にするか」はこのファイルだけが決める。
 * 書体・角丸・線の太さ・テーマ色をまとめて差し替えられるので、
 * ページごとに雰囲気を変えられる（例: Minecraft のページはドット絵風）。
 *
 * 使うスキンは URL の `?skin=` で指定する。
 *   docs/apps/index.html?skin=minecraft
 * 指定が無ければ `DEFAULT_SKIN`。埋め込み側（Markdown）の 1 行を
 * 書き換えるだけで切り替えられる。
 *
 * ページ側（MkDocs のヘッダー・本文）の見た目もここが決める。
 * `npm run build:skins` がこの定義から docs/stylesheets/skins.css を
 * 作るので、書体や色を 2 か所に書く必要はない。
 *
 * 色そのものと配色の検証は theme/palette.ts、部品への割り当ては
 * config/colors.ts。ここは「既定から何を差し替えるか」だけを持つ。
 */
import { BORDER, FONT_FAMILY, FONT_SIZE, RADIUS } from '../theme/tokens';
import type { VizTheme } from '../theme/palette';

export interface SkinFont {
  /** 本文と UI の書体。 */
  family: string;
  /** 数字を並べて比べる箇所の書体。 */
  numeric: string;
  /**
   * 書体の読み込み先（Google Fonts など）。
   * 読み込めない環境では family の後半（代替の書体）が使われる。
   */
  url?: string;
}

export interface Skin {
  /** URL の `?skin=` で指定する名前。 */
  id: string;
  /** 人が読む名前。 */
  label: string;
  /** 何のための見た目かの説明。 */
  description: string;
  font: SkinFont;
  /**
   * 文字の大きさの倍率。
   * 小さく見える書体（ドット書体など）を選んだときに補う。
   */
  fontScale: number;
  /** 角丸の倍率。0 にすると角がすべて直角になる。 */
  radiusScale: number;
  /** 線の太さの倍率。 */
  borderScale: number;
  /**
   * 強調に使う色。既定の配色を上書きする。
   * アプリでは選択・フォーカスの色、ページ側ではヘッダーとリンクの色になる。
   * 明るい配色・暗い配色それぞれに指定する。
   */
  accent?: { light: string; dark: string };
  /**
   * 地の色。既定の配色を上書きする。
   * アプリとページで同じ色を使うので、記事とグラフが地続きに見える。
   */
  background?: { light: string; dark: string };
  /**
   * 単一系列のグラフと強調表示に使う色スロット。
   * 既定（0 番）以外にすると、検証済みの配色の中から色を選び直せる。
   */
  primarySlot?: number;
  /** 図形の輪郭をぼかさない（ドット絵の輪郭を保つ）。 */
  crispEdges: boolean;
}

/** 既定の見た目。 */
export const DEFAULT_SKIN: Skin = {
  id: 'default',
  label: '標準',
  description: 'ポータル全体で使う既定の見た目。',
  font: { family: FONT_FAMILY.base, numeric: FONT_FAMILY.numeric },
  fontScale: 1,
  radiusScale: 1,
  borderScale: 1,
  crispEdges: false,
};

/**
 * Minecraft のページ用のドット絵風。
 *
 * 書体は日本語も含めてドットで描かれる DotGothic16。角を落とさず、
 * 線を太くして、図形の輪郭もぼかさない。色は草の緑に寄せる。
 */
export const MINECRAFT_SKIN: Skin = {
  id: 'minecraft',
  label: 'ドット絵風',
  description: 'Minecraft のページ用。ドット書体・直角・太い線・緑のテーマ色。',
  font: {
    family: "'DotGothic16', 'Hiragino Sans', 'Noto Sans JP', monospace",
    numeric: "'DotGothic16', ui-monospace, monospace",
    url: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',
  },
  /* ドット書体は同じ px でも小さく見えるので、少し大きくする */
  fontScale: 1.1,
  radiusScale: 0,
  borderScale: 2,
  /* 草の緑。明るい配色では濃く、暗い配色では明るくして読めるようにする */
  accent: { light: '#2e7d32', dark: '#6abf69' },
  /* 地は緑を薄く敷く。文字とのコントラストは check:contrast で検査する */
  background: { light: '#f1f7ec', dark: '#141a12' },
  /* 検証済みの配色の中の緑を、単一系列のグラフと強調に使う */
  primarySlot: 5,
  crispEdges: true,
};

export const SKINS: Skin[] = [DEFAULT_SKIN, MINECRAFT_SKIN];

/** 名前からスキンを引く唯一の入口。知らない名前なら既定に落とす。 */
export function skinFor(id: string | null | undefined): Skin {
  return SKINS.find((skin) => skin.id === id) ?? DEFAULT_SKIN;
}

/** URL の `?skin=` から、このページで使うスキンを決める。 */
export function skinFromLocation(): Skin {
  if (typeof window === 'undefined') return DEFAULT_SKIN;
  return skinFor(new URLSearchParams(window.location.search).get('skin'));
}

/* ------------------------------------------------------------------ *
 * 適用
 * ------------------------------------------------------------------ */

/**
 * このページで使うスキン。
 *
 * URL で決まるので画面の途中では変わらない。CSS を通さない値
 * （グラフの角丸など）を組み立てるときに参照する。
 */
let active: Skin = DEFAULT_SKIN;

export function setActiveSkin(skin: Skin): void {
  active = skin;
}

export function activeSkin(): Skin {
  return active;
}

/** 角丸をスキンに合わせる。CSS を経由しない SVG の角丸に使う。 */
export function skinnedRadius(radius: number): number {
  return Math.round(radius * active.radiusScale);
}

/** 文字の大きさをスキンに合わせる。CSS を経由しないグラフの文字に使う。 */
export function skinnedFontSize(size: number): number {
  return Math.round(size * active.fontScale);
}

/** スキンの色をテーマに反映する。差し替えが無ければそのまま返す。 */
export function applySkin(theme: VizTheme, skin: Skin): VizTheme {
  const accent = skin.accent?.[theme.mode];
  const background = skin.background?.[theme.mode];
  const categorical = [...theme.categorical];

  /* 単一系列と強調に使う色を先頭へ入れ替える（色は増やさず、検証済みの中から選ぶ） */
  if (skin.primarySlot !== undefined) {
    const index = skin.primarySlot % categorical.length;
    [categorical[0], categorical[index]] = [categorical[index], categorical[0]];
  }

  return {
    ...theme,
    accent: accent ?? theme.accent,
    /* 面も地に合わせる。グラフの下地と記事の地の色を同じにするため */
    background: background ?? theme.background,
    surface: background ?? theme.surface,
    categorical,
  };
}

/** スキンによる寸法・書体の差し替えを CSS カスタムプロパティにする。 */
export function skinCssVariables(skin: Skin): Record<string, string> {
  const variables: Record<string, string> = {
    '--font-family': skin.font.family,
    '--font-family-numeric': skin.font.numeric,
  };
  for (const [key, value] of Object.entries(FONT_SIZE)) {
    variables[`--font-size-${key}`] = `${Math.round(value * skin.fontScale)}px`;
  }
  for (const [key, value] of Object.entries(RADIUS)) {
    variables[`--radius-${key}`] = `${Math.round(value * skin.radiusScale)}px`;
  }
  for (const [key, value] of Object.entries(BORDER)) {
    variables[`--border-${key}`] = `${value * skin.borderScale}px`;
  }
  return variables;
}
