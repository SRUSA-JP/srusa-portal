/**
 * 相関図の表示設定。
 *
 * 寸法・間隔・分類ごとの見せ方は、この 1 ファイルだけが持つ。
 * 描画側（display.ts / 各コンポーネント）は必ずここを参照し、
 * 数値や分類名を直接書かない。ここを編集すれば全ての表示が変わる。
 *
 * 色そのものは持たない。色は theme/palette.ts が唯一の出どころで、
 * ここでは「何番目の色スロットを使うか」だけを決める。
 */
import type { GroupType } from './schema';

/**
 * 人物ノード。
 *
 * アイコン画像（`Person.avatarUrl`）があればそれを、無ければ `fallback` の
 * 代替表示を出す。どちらでも大きさと位置は同じなので、後から画像を足しても
 * レイアウトは変わらない。
 */
export const NODE = {
  /** アイコンの直径。 */
  size: 34,
  /** 中心人物の倍率。 */
  centerScale: 1.35,
  /** ノード同士の間隔（ラベルの重なりを避ける最小幅）。 */
  gapX: 124,
  gapY: 72,
  labelFontSize: 11,
  /** アイコン下端からラベルまでの距離。 */
  labelOffsetY: 14,
  /** 枠線の太さ。 */
  ringWidth: 1.5,
  /** アイコン画像が無いときの代替表示。 */
  fallback: 'silhouette' as 'silhouette' | 'initial',
} as const;

/**
 * 所属が無く、特定の人物とだけ繋がっている人の配置。
 * 相手の近くに置くことで、図を横切る長い関係線を減らす。
 */
export const SATELLITE = {
  /** 他のノードから最低限空ける距離。 */
  minDistance: 104,
  /** 空き場所を探すときの半径の刻み。 */
  radiusStep: 46,
  /** 1 周あたりの試行方向の数。 */
  directions: 16,
  /** 探索する最大半径。 */
  maxRadius: 460,
} as const;

/** 同じ所属の組み合わせを持つ人のまとまり。 */
export const CLUSTER = {
  /** 1 クラスタあたりの最大列数。増やすと横長になる。 */
  maxColumns: 4,
  /** クラスタ同士の間隔。領域の余白より広く取る。 */
  gap: 88,
  /**
   * 並び順を決めるときに、関係の多さをどれだけ重視するか。
   * 0 なら所属の重なりだけ、大きくすると関係のあるクラスタを優先して隣に置く。
   */
  relationAffinity: 1.2,
  /** 関係の多さを 1.0 と見なす本数。 */
  relationSaturation: 2,
} as const;

/** 図全体。 */
export const CANVAS = {
  padding: 72,
  /** 行を折り返す目安の幅。実際の幅は内容に合わせて決まる。 */
  targetWidth: 1180,
} as const;

/** グループを囲う領域。 */
export const REGION = {
  /** ノードの外側に取る余白。入れ子を見せるため分類ごとに縮める。 */
  padding: 34,
  /** 入れ子 1 段ごとに余白を詰める量。 */
  nestedPaddingStep: 12,
  cornerRadius: 18,
  strokeWidth: 1.5,
  /** 塗りの不透明度。重なりを見せるため薄くする。 */
  fillAlpha: 0.1,
  /** 強調時の塗りの不透明度。 */
  highlightFillAlpha: 0.22,
  labelFontSize: 12,
  labelOffsetY: -8,
} as const;

/** 関係線。 */
export const EDGE = {
  width: 1.5,
  /**
   * 曲がり具合（線の長さに対する膨らみの比率）。
   * 直線だと同じ人に集まる線が重なるので、わずかに弧を描かせる。
   */
  curvature: 0.16,
  /** 弧の膨らみの上限（座標単位）。 */
  maxBow: 54,
  /** 確度が低い関係の破線パターン。 */
  uncertainDash: '5 4',
  opacity: 0.75,
  /** 中心人物に繋がる線の強調幅。 */
  highlightWidth: 2.5,
} as const;

/** 凡例。 */
export const LEGEND = {
  swatchSize: 12,
  fontSize: 12,
} as const;

/**
 * グループの分類ごとの見せ方。
 *
 * - `label`: 凡例に出す分類名
 * - `colorSlot`: theme.categorical の何番目を使うか（8 枠を循環）
 * - `depth`: 入れ子の深さ。大きいほど内側に描き、余白を詰める
 * - `order`: 描画順の基準。小さいほど先（＝下）に描く
 */
export interface GroupTypeSetting {
  label: string;
  colorSlot: number;
  depth: number;
  order: number;
}

export const GROUP_TYPE_SETTINGS: Record<GroupType, GroupTypeSetting> = {
  university: { label: '大学', colorSlot: 0, depth: 0, order: 10 },
  lab: { label: '研究室', colorSlot: 3, depth: 1, order: 60 },
  school: { label: '高校', colorSlot: 1, depth: 0, order: 20 },
  school_stage: { label: '学校段階', colorSlot: 2, depth: 0, order: 30 },
  education: { label: '塾', colorSlot: 4, depth: 0, order: 40 },
  company: { label: '会社', colorSlot: 5, depth: 0, order: 50 },
  club: { label: '部活', colorSlot: 6, depth: 1, order: 70 },
  friend_group: { label: '友人グループ', colorSlot: 7, depth: 1, order: 80 },
  activity: { label: '活動', colorSlot: 5, depth: 1, order: 90 },
  relationship_context: { label: '関係の文脈', colorSlot: 6, depth: 1, order: 100 },
  unknown: { label: '不明', colorSlot: 2, depth: 0, order: 110 },
};

/** 定義にない分類が来たときの既定値。データが増えても落ちないようにする。 */
export const FALLBACK_GROUP_TYPE: GroupTypeSetting = {
  label: 'その他',
  colorSlot: 2,
  depth: 0,
  order: 120,
};

/** 分類ごとの設定を引く唯一の入口。設定表を直接参照しない。 */
export function groupTypeSetting(type: GroupType): GroupTypeSetting {
  return GROUP_TYPE_SETTINGS[type] ?? FALLBACK_GROUP_TYPE;
}

/** 所属が 1 つも無い人の扱い。 */
export const UNASSIGNED = {
  /** 図の中で使う仮のグループ ID と表示名。 */
  groupId: '__unassigned__',
  label: '所属情報なし',
  type: 'unknown' as GroupType,
  /** 領域として囲うか。 */
  showRegion: false,
} as const;

/** 関係線の表示切り替え。 */
export const EDGE_MODES = [
  { value: 'all', label: 'すべて表示' },
  { value: 'center', label: '中心人物のみ' },
  { value: 'none', label: '非表示' },
] as const;

export type EdgeMode = (typeof EDGE_MODES)[number]['value'];
