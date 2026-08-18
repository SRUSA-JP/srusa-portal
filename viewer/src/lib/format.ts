/** 表示用のフォーマッタとラベル辞書。UI 文言はここに集約する。 */

const numberFormat = new Intl.NumberFormat('ja-JP');
const decimalFormats = [
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 3 }),
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }),
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }),
];
const compactFormat = new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 1 });

export function formatInt(value: number): string {
  return numberFormat.format(Math.round(value));
}

/**
 * 小数の表示。
 *
 * 1時間あたりの換算値は 0.05 のような小さい数になるため、桁数を値の大きさで
 * 切り替える。そうしないと「0」ばかりのラベルになる。
 */
export function formatDecimal(value: number): string {
  const magnitude = Math.abs(value);
  const format = magnitude < 1 ? decimalFormats[0] : magnitude < 10 ? decimalFormats[1] : decimalFormats[2];
  return format.format(value);
}

/** 軸ラベル用の短縮表記（1.2万 など）。 */
export function formatCompact(value: number): string {
  return compactFormat.format(value);
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${formatInt(h)}時間${String(m).padStart(2, '0')}分`;
}

/** `minecraft:` 等の名前空間を落として ID 部分だけにする。 */
export function stripNamespace(id: string): string {
  const index = id.indexOf(':');
  return index === -1 ? id : id.slice(index + 1);
}

/** `cave_spider` → `Cave Spider`。翻訳辞書がない ID の既定表示。 */
export function prettifyId(id: string): string {
  return stripNamespace(id)
    .split(/[_/]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** 移動手段の日本語ラベル。 */
export const MOVEMENT_LABELS: Record<string, string> = {
  walk: '徒歩',
  sprint: 'ダッシュ',
  crouch: 'しゃがみ',
  swim: '水泳',
  walk_under_water: '水中歩行',
  walk_on_water: '水上歩行',
  fall: '落下',
  climb: '登り',
  fly: '飛行',
  boat: 'ボート',
  horse: '馬',
  minecart: 'トロッコ',
  pig: '豚',
  strider: 'ストライダー',
  aviate: 'エリトラ',
};

/** 行動系カウンタの日本語ラベル。 */
export const ACTIVITY_LABELS: Record<string, string> = {
  chests_opened: 'チェストを開けた',
  enderchests_opened: 'エンダーチェストを開けた',
  barrels_opened: '樽を開けた',
  trapped_chests_triggered: 'トラップチェスト',
  crafting_table_uses: '作業台の使用',
  furnace_uses: 'かまどの使用',
  blast_furnace_uses: '溶鉱炉の使用',
  smithing_table_uses: '鍛冶台の使用',
  stonecutter_uses: '石切台の使用',
  anvil_uses: '金床の使用',
  brewing_stand_uses: '醸造台の使用',
  items_enchanted: 'エンチャント回数',
  villager_trades: '村人との取引',
  villagers_talked_to: '村人に話しかけた',
  animals_bred: '動物の繁殖',
  fish_caught: '釣った魚',
  slept_in_bed: 'ベッドで寝た',
};

/** Twilight Forest 固有カウンタのラベル。 */
export const TWILIGHT_LABELS: Record<string, string> = {
  trophy_pedestals_activated: 'トロフィー台座の起動',
  keeping_charms_activated: '保護のお守り発動',
  life_charms_activated: '生命のお守り発動',
  e115_slices_eaten: '実験 115 を食べた',
};

export function labelFor(id: string, dictionary: Record<string, string>): string {
  return dictionary[stripNamespace(id)] ?? prettifyId(id);
}
