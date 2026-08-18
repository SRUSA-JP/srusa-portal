/**
 * 表示のための関数。
 *
 * 「何をどう見せるか」の決定はここに集約する。コンポーネントは
 * ここが返した値をそのまま属性へ渡すだけで、色・寸法・文言を自分で決めない。
 *
 * - 寸法・分類ごとの設定 → config.ts
 * - 色そのもの・コントラスト計算 → theme/palette.ts
 *
 * このファイルは両者を組み合わせるだけで、独自の色コードや数値を持たない。
 */
import {
  CONTRAST_MIN_LARGE,
  CONTRAST_MIN_TEXT,
  chartText,
  ensureContrast,
  mutedFill,
  readableTextOn,
  withAlpha,
  type VizTheme,
} from '../theme/palette';
import { EDGE, NODE, REGION, groupTypeSetting } from './config';
import type { Group, Person, Relation } from './schema';

/* ------------------------------------------------------------------ *
 * 文言
 * ------------------------------------------------------------------ */

/** 人物の表示名。`project.nameMode` で切り替える。 */
export function personLabel(person: Person, nameMode: string): string {
  if (nameMode === 'nickname' && person.nicknames.length > 0) return person.nicknames[0];
  if (nameMode === 'alias' && person.aliases && person.aliases.length > 0) return person.aliases[0];
  return person.onlineName;
}

/** グループの表示名。 */
export function groupLabel(group: Group): string {
  return group.name;
}

/** グループの分類名（凡例の見出し）。 */
export function groupTypeLabel(type: string): string {
  return groupTypeSetting(type).label;
}

/** 関係の説明文（ツールチップ）。 */
export function relationLabel(relation: Relation, nameOf: (id: string) => string): string {
  const base = `${nameOf(relation.source)} ↔ ${nameOf(relation.target)}`;
  const context = relation.context ? `（${relation.context}）` : '';
  const uncertain = relation.uncertain ? ' ※確度が低い関係' : '';
  return `${base}${context}${uncertain}`;
}

/* ------------------------------------------------------------------ *
 * 色と寸法
 * ------------------------------------------------------------------ */

export interface RegionStyle {
  stroke: string;
  fill: string;
  labelColor: string;
  strokeWidth: number;
  cornerRadius: number;
  labelFontSize: number;
  labelOffsetY: number;
}

/**
 * グループ領域の見た目。
 *
 * 枠線と塗りは分類ごとの色スロットから作り、文字色は背景に対して
 * コントラスト比を満たすところまで寄せる。
 */
export function regionStyle(group: Group, theme: VizTheme, highlighted: boolean): RegionStyle {
  const setting = groupTypeSetting(group.type);
  const base = theme.categorical[setting.colorSlot % theme.categorical.length];
  const stroke = ensureContrast(base, theme.surface, CONTRAST_MIN_LARGE);
  return {
    stroke,
    fill: withAlpha(stroke, highlighted ? REGION.highlightFillAlpha : REGION.fillAlpha),
    labelColor: ensureContrast(base, theme.surface, CONTRAST_MIN_TEXT),
    strokeWidth: REGION.strokeWidth,
    cornerRadius: REGION.cornerRadius,
    labelFontSize: REGION.labelFontSize,
    labelOffsetY: REGION.labelOffsetY,
  };
}

/** 領域の重ね順。面積が大きいものを先に描き、内側のグループを上に載せる。 */
export function regionPaintOrder(a: { area: number; group: Group }, b: { area: number; group: Group }): number {
  return b.area - a.area || groupTypeSetting(a.group.type).order - groupTypeSetting(b.group.type).order;
}

export interface NodeStyle {
  /** アイコンの直径。 */
  size: number;
  radius: number;
  /** アイコンの背景。画像が無いときはこの上に代替表示を描く。 */
  fill: string;
  /** 枠線。 */
  ring: string;
  ringWidth: number;
  /** 代替表示（人型・イニシャル）の色。背景に対して読める色を返す。 */
  glyphColor: string;
  labelColor: string;
  labelFontSize: number;
  labelOffsetY: number;
  fontWeight: number;
}

export interface NodeState {
  isCenter: boolean;
  /** 中心人物と関係のある人物。 */
  isRelated: boolean;
  /** 絞り込みの対象外。 */
  isDimmed: boolean;
}

/** 人物ノードの見た目。アイコンの有無に関わらず同じ寸法を返す。 */
export function nodeStyle(theme: VizTheme, state: NodeState): NodeStyle {
  const accent = ensureContrast(theme.categorical[0], theme.surface, CONTRAST_MIN_LARGE);
  const neutral = chartText(theme, 'secondary');
  const dimmed = mutedFill(theme);
  const size = state.isCenter ? NODE.size * NODE.centerScale : NODE.size;
  const fill = theme.surface;

  return {
    size,
    radius: size / 2,
    fill,
    ring: state.isDimmed ? dimmed : state.isCenter || state.isRelated ? accent : neutral,
    ringWidth: state.isCenter ? NODE.ringWidth * 2 : NODE.ringWidth,
    /* 代替表示はアイコン背景の上に載るので、その背景に対して選ぶ */
    glyphColor: state.isDimmed ? dimmed : readableTextOn(fill, theme, CONTRAST_MIN_LARGE),
    labelColor: state.isDimmed
      ? dimmed
      : chartText(theme, state.isCenter || state.isRelated ? 'primary' : 'secondary'),
    labelFontSize: NODE.labelFontSize,
    labelOffsetY: size / 2 + NODE.labelOffsetY,
    fontWeight: state.isCenter ? 600 : 400,
  };
}

/**
 * ノードに出す絵の指定。
 *
 * 画像 URL があれば画像、無ければ config の代替表示（人型 / イニシャル）。
 * データに `avatarUrl` を足すだけで、この関数の戻り値が変わって
 * 全てのノードがアイコン表示になる。
 */
export type AvatarContent =
  | { kind: 'image'; src: string }
  | { kind: 'initial'; text: string }
  | { kind: 'silhouette' };

export function avatarFor(person: Person, nameMode: string): AvatarContent {
  if (person.avatarUrl) return { kind: 'image', src: person.avatarUrl };
  if (NODE.fallback === 'initial') {
    return { kind: 'initial', text: [...personLabel(person, nameMode)][0]?.toUpperCase() ?? '?' };
  }
  return { kind: 'silhouette' };
}

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
  /** 弧の膨らみ（座標単位）。0 なら直線。 */
  bow: number;
}

/** 線の長さから弧の膨らみを決める。長い線ほど曲げて、束になった線をほどく。 */
function bowFor(length: number): number {
  return Math.min(length * EDGE.curvature, EDGE.maxBow);
}

/** 関係線の見た目。長さを渡すと、その長さに応じた弧の膨らみも返す。 */
export function edgeStyle(
  relation: Relation,
  theme: VizTheme,
  highlighted: boolean,
  length = 0,
): EdgeStyle {
  return {
    stroke: highlighted
      ? ensureContrast(theme.categorical[0], theme.surface, CONTRAST_MIN_LARGE)
      : chartText(theme, 'secondary'),
    strokeWidth: highlighted ? EDGE.highlightWidth : EDGE.width,
    strokeDasharray: relation.uncertain ? EDGE.uncertainDash : undefined,
    opacity: EDGE.opacity,
    bow: bowFor(length),
  };
}
