import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listDatasets, loadAllDatasets, loadDataset } from './data/datasets';
import { checkTotals, parseStatsJson } from './data/parse';
import type { ItemMetric, StatsDocument } from './data/schema';
import {
  ChartCard,
  KpiGrid,
  KpiTile,
  MetricScatter,
  RankBarChart,
  SeriesBarChart,
  TrendLineChart,
} from './components';
import type { Column } from './components';
import {
  damageSeries,
  deathCauseRanking,
  filterRows,
  filterSeriesRows,
  itemRanking,
  killRanking,
  metricRange,
  metricTimeline,
  movementStacked,
  playerRows,
  rankBy,
  scatterBy,
  toRateEntries,
  toRateSeries,
  topWithOther,
  totalPlaytimeHours,
  TIMELINE_CATEGORY_KEY,
  type NumericPlayerRowKey,
  type PlayerFilter,
  type RateBasis,
  type Snapshot,
} from './lib/selectors';
import { downloadJson, type Row } from './lib/export';
import { formatDecimal, formatHours, formatInt } from './lib/format';
import { useVizTheme } from './theme/useThemeMode';

/** プレイヤー単位で比較できる指標。ランキングと散布図の選択肢になる。 */
interface MetricOption {
  value: NumericPlayerRowKey;
  label: string;
  unit: string;
  /** 1時間あたりへの換算に意味があるか（既に時間あたりの指標は false）。 */
  ratable: boolean;
}

const METRICS: MetricOption[] = [
  { value: 'playtime_hours', label: 'プレイ時間', unit: ' h' , ratable: false },
  { value: 'distance_km', label: '移動距離', unit: ' km' , ratable: true },
  { value: 'deaths', label: '死亡回数', unit: ' 回' , ratable: true },
  { value: 'deaths_per_hour', label: '死亡回数（1時間あたり）', unit: ' 回/h' , ratable: false },
  { value: 'mob_kills', label: 'mob 撃破数', unit: ' 体' , ratable: true },
  { value: 'mob_kills_per_hour', label: 'mob 撃破数（1時間あたり）', unit: ' 体/h' , ratable: false },
  { value: 'player_kills', label: 'プレイヤー撃破数', unit: ' 人' , ratable: true },
  { value: 'damage_dealt_hp', label: '与ダメージ', unit: ' HP' , ratable: true },
  { value: 'damage_taken_hp', label: '被ダメージ', unit: ' HP' , ratable: true },
  { value: 'blocks_mined', label: '採掘したブロック', unit: ' 個' , ratable: true },
  { value: 'items_crafted', label: 'クラフトしたアイテム', unit: ' 個' , ratable: true },
  { value: 'items_used', label: '使用したアイテム', unit: ' 個' , ratable: true },
  { value: 'items_picked_up', label: '拾得したアイテム', unit: ' 個' , ratable: true },
  { value: 'items_dropped', label: '捨てた・落としたアイテム', unit: ' 個' , ratable: true },
  { value: 'tools_broken', label: '壊れた道具', unit: ' 本' , ratable: true },
  { value: 'jumps', label: 'ジャンプ回数', unit: ' 回' , ratable: true },
  { value: 'advancements', label: '進捗の達成数', unit: ' 件' , ratable: true },
  { value: 'recipes_unlocked', label: '解放したレシピ数', unit: ' 件' , ratable: true },
  { value: 'chests_opened', label: 'チェストを開けた回数', unit: ' 回' , ratable: true },
  { value: 'villager_trades', label: '村人との取引回数', unit: ' 回' , ratable: true },
];

/** 値の見せ方。すべてのグラフで同じ選択肢を使う。 */
const BASIS_OPTIONS: Array<{ value: RateBasis; label: string; suffix: string }> = [
  { value: 'total', label: '実数', suffix: '' },
  { value: 'per_playtime_hour', label: '1時間あたり', suffix: '/h' },
  { value: 'per_playtime_day', label: '1プレイ日あたり', suffix: '/日' },
];

/** 1時間あたり表示に切り替えたとき、換算できない指標から移す先。 */
const FALLBACK_RATABLE_METRIC: NumericPlayerRowKey = 'mob_kills';

/** 基準に応じた単位（例: ' 体' → ' 体/h'）。単位の組み立てはここだけで行う。 */
function unitFor(unit: string, basis: RateBasis): string {
  return `${unit}${BASIS_OPTIONS.find((option) => option.value === basis)?.suffix ?? ''}`;
}

/** 基準で選べる指標の一覧。 */
function metricsFor(basis: RateBasis): MetricOption[] {
  return basis === 'total' ? METRICS : METRICS.filter((metric) => metric.ratable);
}

/** 換算後の分母の説明。グラフの注記に使う。 */
function basisNote(basis: RateBasis, subject: string): string {
  switch (basis) {
    case 'per_playtime_hour':
      return `${subject}のプレイ時間で割った、1時間あたりの値です。`;
    case 'per_playtime_day':
      return `${subject}のプレイ時間を24時間で1日と数え、1日あたりに換算した値です。カレンダー上の経過日数ではありません。`;
    default:
      return '';
  }
}

function isRatable(metric: NumericPlayerRowKey): boolean {
  return METRICS.find((m) => m.value === metric)?.ratable ?? false;
}

/** 内訳グラフで選べる集計軸。`kind` が 'item' のものは production 配下の CountMap。 */
type BreakdownId = 'kills' | 'death_causes' | ItemMetric;

interface BreakdownOption {
  value: BreakdownId;
  label: string;
  unit: string;
  note: string;
}

const BREAKDOWNS: BreakdownOption[] = [
  {
    value: 'kills',
    label: '倒した mob',
    unit: ' 体',
    note: '直接倒した分のみ。落下や溶岩による撃破は含まれません。',
  },
  {
    value: 'death_causes',
    label: '死因',
    unit: ' 回',
    note: 'mob 以外の死因は「環境ダメージほか」にまとめています。',
  },
  { value: 'mined', label: '採掘したブロック', unit: ' 個', note: '' },
  { value: 'crafted', label: 'クラフトしたアイテム', unit: ' 個', note: '' },
  { value: 'used', label: '使用したアイテム', unit: ' 個', note: '' },
  { value: 'picked_up', label: '拾得したアイテム', unit: ' 個', note: '' },
  { value: 'dropped', label: '捨てたアイテム', unit: ' 個', note: '' },
  { value: 'broken', label: '壊れた道具', unit: ' 個', note: '' },
];

/** 複数系列グラフで選べる比較軸。 */
type SeriesId = 'movement' | 'damage';

const SERIES_OPTIONS: Array<{ value: SeriesId; label: string; unit: string; stacked: boolean; note: string }> = [
  {
    value: 'movement',
    label: '移動手段の内訳',
    unit: ' km',
    stacked: true,
    note: '上位5手段のみ色を割り当て、残りは「その他」に畳んでいます。',
  },
  {
    value: 'damage',
    label: '与ダメージと被ダメージ',
    unit: ' HP',
    stacked: false,
    note: '',
  },
];

/** グラフ上に置くプルダウン。 */
function Picker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value as T)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const PLAYER_COLUMN: Column = { key: 'player', label: 'プレイヤー', align: 'left' };

export function App() {
  const theme = useVizTheme();
  const datasets = useMemo(() => listDatasets(), []);
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? '');
  const [doc, setDoc] = useState<StatsDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // 全グラフ共通の絞り込み
  const [filterMetric, setFilterMetric] = useState<NumericPlayerRowKey>('playtime_hours');
  /** 利用者が動かした範囲。null なら指標の全範囲（＝絞り込みなし）。 */
  const [filterBounds, setFilterBounds] = useState<{ min: number; max: number } | null>(null);

  // 各グラフのパラメータ
  const [rankMetric, setRankMetric] = useState<NumericPlayerRowKey>('playtime_hours');
  const [rankBasis, setRankBasis] = useState<RateBasis>('total');
  const [breakdown, setBreakdown] = useState<BreakdownId>('kills');
  const [breakdownPlayer, setBreakdownPlayer] = useState('');
  const [breakdownBasis, setBreakdownBasis] = useState<RateBasis>('total');
  const [seriesId, setSeriesId] = useState<SeriesId>('movement');
  const [seriesBasis, setSeriesBasis] = useState<RateBasis>('total');
  const [scatterX, setScatterX] = useState<NumericPlayerRowKey>('playtime_hours');
  const [scatterY, setScatterY] = useState<NumericPlayerRowKey>('mob_kills');
  const [scatterBasis, setScatterBasis] = useState<RateBasis>('total');
  const [trendMetric, setTrendMetric] = useState<NumericPlayerRowKey>('playtime_hours');
  const [trendBasis, setTrendBasis] = useState<RateBasis>('total');
  const [trendPerPlayer, setTrendPerPlayer] = useState<'total' | 'per_player'>('total');
  /** 日付ごとの推移に使う全スナップショット。 */
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const changeTrendBasis = useCallback((basis: RateBasis) => {
    setTrendBasis(basis);
    setTrendMetric((metric) =>
      basis !== 'total' && !isRatable(metric) ? FALLBACK_RATABLE_METRIC : metric,
    );
  }, []);

  /* 1時間あたりに切り替えたとき、換算できない指標を選んだままにしない */
  const changeRankBasis = useCallback(
    (basis: RateBasis) => {
      setRankBasis(basis);
      setRankMetric((metric) =>
        basis !== 'total' && !isRatable(metric) ? FALLBACK_RATABLE_METRIC : metric,
      );
    },
    [],
  );

  const changeScatterBasis = useCallback((basis: RateBasis) => {
    setScatterBasis(basis);
    const fix = (metric: NumericPlayerRowKey) =>
      basis !== 'total' && !isRatable(metric) ? FALLBACK_RATABLE_METRIC : metric;
    setScatterX(fix);
    setScatterY(fix);
  }, []);

  useEffect(() => {
    if (!datasetId) return;
    let cancelled = false;
    loadDataset(datasetId)
      .then((loaded) => {
        if (cancelled) return;
        setDoc(loaded);
        setSourceLabel(`data/minecraft-stats-${datasetId}.json`);
        setError(null);
      })
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  useEffect(() => {
    let cancelled = false;
    loadAllDatasets()
      .then((loaded) => {
        if (cancelled) return;
        setSnapshots(loaded.map((entry) => ({ label: entry.label, doc: entry.doc })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const importFile = useCallback(async (file: File) => {
    try {
      const loaded = parseStatsJson(await file.text());
      setDoc(loaded);
      setSourceLabel(`${file.name}（読み込み）`);
      setBreakdownPlayer('');
      setFilterBounds(null);
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, []);

  const allRows = useMemo(() => (doc ? playerRows(doc) : []), [doc]);
  const filterRange = useMemo(() => metricRange(allRows, filterMetric), [allRows, filterMetric]);
  const filter: PlayerFilter = {
    metric: filterMetric,
    min: filterBounds?.min ?? filterRange.min,
    max: filterBounds?.max ?? filterRange.max,
  };
  const rows = useMemo(() => filterRows(allRows, filter), [allRows, filter.metric, filter.min, filter.max]);
  const playerNames = useMemo(() => rows.map((row) => row.name), [rows]);
  const filterOption = METRICS.find((m) => m.value === filterMetric) ?? METRICS[0];
  const filtered = rows.length !== allRows.length;
  const mismatches = useMemo(() => (doc ? checkTotals(doc) : []), [doc]);

  /* 指標を変えたら範囲は全範囲に戻す（前の指標の値をそのまま使わない） */
  const changeFilterMetric = useCallback((metric: NumericPlayerRowKey) => {
    setFilterMetric(metric);
    setFilterBounds(null);
  }, []);

  /* 絞り込みで対象外になったプレイヤーを内訳グラフで選んだままにしない */
  const effectivePlayer = playerNames.includes(breakdownPlayer) ? breakdownPlayer : '';

  const kpi = useMemo(
    () => ({
      players: rows.length,
      playtime: rows.reduce((acc, row) => acc + row.playtime_hours, 0),
      distance: rows.reduce((acc, row) => acc + row.distance_km, 0),
      deaths: rows.reduce((acc, row) => acc + row.deaths, 0),
    }),
    [rows],
  );

  const rankOption = METRICS.find((m) => m.value === rankMetric) ?? METRICS[0];
  const scatterXOption = METRICS.find((m) => m.value === scatterX) ?? METRICS[0];
  const scatterYOption = METRICS.find((m) => m.value === scatterY) ?? METRICS[0];
  const trendMetricOption = METRICS.find((m) => m.value === trendMetric) ?? METRICS[0];
  const breakdownOption = BREAKDOWNS.find((b) => b.value === breakdown) ?? BREAKDOWNS[0];
  const seriesOption = SERIES_OPTIONS.find((s) => s.value === seriesId) ?? SERIES_OPTIONS[0];

  const rankData = useMemo(
    () => rankBy(rows, rankMetric, { basis: rankBasis }),
    [rows, rankMetric, rankBasis],
  );

  /* 内訳は分母が 1 つ（選択中プレイヤー、または全員の合計プレイ時間） */
  const breakdownHours = useMemo(
    () => totalPlaytimeHours(rows, effectivePlayer ? [effectivePlayer] : undefined),
    [rows, effectivePlayer],
  );

  const breakdownData = useMemo(() => {
    if (!doc) return [];
    const options = { players: effectivePlayer ? [effectivePlayer] : playerNames };
    const entries =
      breakdown === 'kills'
        ? killRanking(doc, options)
        : breakdown === 'death_causes'
          ? deathCauseRanking(doc, options)
          : itemRanking(doc, breakdown, options);
    return toRateEntries(topWithOther(entries, 8), breakdownHours, breakdownBasis);
  }, [doc, breakdown, effectivePlayer, playerNames, breakdownHours, breakdownBasis]);

  const seriesData = useMemo(() => {
    if (!doc) return { series: [], rows: [] };
    const raw = seriesId === 'movement' ? movementStacked(doc) : damageSeries(doc);
    return toRateSeries(filterSeriesRows(raw, playerNames), rows, seriesBasis);
  }, [doc, seriesId, rows, playerNames, seriesBasis]);

  const trendData = useMemo(
    () =>
      metricTimeline(snapshots, trendMetric, {
        players: playerNames,
        basis: trendBasis,
        perPlayer: trendPerPlayer === 'per_player',
      }),
    [snapshots, trendMetric, playerNames, trendBasis, trendPerPlayer],
  );

  const scatterPoints = useMemo(
    () => scatterBy(rows, scatterX, scatterY, scatterBasis),
    [rows, scatterX, scatterY, scatterBasis],
  );

  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1>Minecraft サーバー統計</h1>
          {doc && (
            <p className="note">
              {doc.generated_on} 時点 / {doc.source.minecraft_version}・{doc.source.loader}・難易度{' '}
              {doc.source.difficulty} / {sourceLabel}
            </p>
          )}
        </div>
        <div className="app-actions">
          {datasets.length > 1 && (
            <select
              value={datasetId}
              onChange={(event) => setDatasetId(event.target.value)}
              aria-label="データセット"
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = '';
            }}
          />
          <button type="button" className="ghost" onClick={() => fileInput.current?.click()}>
            JSON を読み込む
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!doc}
            onClick={() => doc && downloadJson(`players-${doc.generated_on}.json`, playerRows(doc))}
          >
            サマリを書き出す
          </button>
        </div>
      </header>

      {error && <p className="error">読み込みエラー: {error}</p>}
      {mismatches.length > 0 && (
        <p className="error">
          totals とプレイヤー合計が一致しません: {mismatches.map((m) => m.field).join(', ')}
        </p>
      )}

      <main>
        {!doc && !error && datasets.length === 0 && (
          <p className="note">
            data/minecraft-stats-*.json が見つかりません。右上の「JSON を読み込む」からファイルを指定してください。
          </p>
        )}
        {!doc && !error && datasets.length > 0 && <p className="note">読み込み中…</p>}

        {doc && (
          <>
            <section className="card">
              <header className="card-head">
                <div>
                  <h3>絞り込み</h3>
                  <p className="note">
                    {filtered
                      ? `${formatInt(allRows.length)} 人中 ${formatInt(rows.length)} 人を表示しています。以降のグラフはすべてこの範囲で計算されます。`
                      : `${formatInt(allRows.length)} 人すべてを表示しています。指標の範囲を狭めると全グラフに反映されます。`}
                  </p>
                </div>
                <div className="card-actions">
                  <Picker
                    label="絞り込む指標"
                    value={filterMetric}
                    options={METRICS}
                    onChange={changeFilterMetric}
                  />
                  <label className="field">
                    下限
                    <input
                      type="number"
                      step="any"
                      value={filter.min}
                      aria-label={`${filterOption.label}の下限`}
                      onChange={(event) =>
                        setFilterBounds({ min: Number(event.target.value), max: filter.max })
                      }
                    />
                  </label>
                  <label className="field">
                    上限
                    <input
                      type="number"
                      step="any"
                      value={filter.max}
                      aria-label={`${filterOption.label}の上限`}
                      onChange={(event) =>
                        setFilterBounds({ min: filter.min, max: Number(event.target.value) })
                      }
                    />
                  </label>
                  <span className="note">{filterOption.unit.trim()}</span>
                  <button type="button" className="ghost" disabled={!filtered} onClick={() => setFilterBounds(null)}>
                    解除
                  </button>
                </div>
              </header>
            </section>

            <KpiGrid>
              <KpiTile
                label="プレイヤー数"
                value={`${formatInt(kpi.players)} 人`}
                sub={filtered ? `全 ${formatInt(allRows.length)} 人中` : undefined}
              />
              <KpiTile label="合計プレイ時間" value={formatHours(kpi.playtime)} />
              <KpiTile label="合計移動距離" value={`${formatDecimal(kpi.distance)} km`} />
              <KpiTile label="合計死亡回数" value={`${formatInt(kpi.deaths)} 回`} />
            </KpiGrid>

            <ChartCard
              title="プレイヤー比較（横棒グラフ）"
              note={basisNote(rankBasis, '各プレイヤー') || '選んだ指標でプレイヤーを降順に並べます。'}
              actions={
                <>
                  <Picker
                    label="指標"
                    value={rankMetric}
                    options={metricsFor(rankBasis)}
                    onChange={setRankMetric}
                  />
                  <Picker
                    label="値の基準"
                    value={rankBasis}
                    options={BASIS_OPTIONS}
                    onChange={changeRankBasis}
                  />
                </>
              }
              tableRows={rankData.map<Row>((entry) => ({
                player: entry.label,
                value: entry.value,
              }))}
              tableColumns={[
                PLAYER_COLUMN,
                { key: 'value', label: `${rankOption.label}${unitFor(rankOption.unit, rankBasis)}` },
              ]}
              csvName={`ranking-${rankMetric}-${rankBasis}.csv`}
            >
              {rankData.length > 0 ? (
                <RankBarChart
                  data={rankData}
                  theme={theme}
                  unit={unitFor(rankOption.unit, rankBasis)}
                  height={Math.max(280, rankData.length * 26)}
                />
              ) : (
                <p className="note">条件に合うプレイヤーがいません。</p>
              )}
            </ChartCard>

            <ChartCard
              title="内訳（横棒グラフ）"
              note={[
                '上位8件を表示し、残りは「その他」に畳んでいます。',
                breakdownOption.note,
                breakdownBasis === 'total'
                  ? ''
                  : `${basisNote(breakdownBasis, '対象')}（合計 ${formatDecimal(breakdownHours)} 時間）`,
              ]
                .filter(Boolean)
                .join('')}
              actions={
                <>
                  <Picker
                    label="集計対象"
                    value={breakdown}
                    options={BREAKDOWNS}
                    onChange={setBreakdown}
                  />
                  <Picker
                    label="プレイヤー"
                    value={effectivePlayer}
                    options={[
                      { value: '', label: '対象全員の合計' },
                      ...playerNames.map((name) => ({ value: name, label: name })),
                    ]}
                    onChange={setBreakdownPlayer}
                  />
                  <Picker
                    label="値の基準"
                    value={breakdownBasis}
                    options={BASIS_OPTIONS}
                    onChange={setBreakdownBasis}
                  />
                </>
              }
              tableRows={breakdownData.map<Row>((entry) => ({
                item: entry.label,
                value: entry.value,
              }))}
              tableColumns={[
                { key: 'item', label: breakdownOption.label, align: 'left' },
                {
                  key: 'value',
                  label:
                    breakdownBasis === 'total'
                      ? '件数'
                      : (BASIS_OPTIONS.find((option) => option.value === breakdownBasis)?.label ?? '件数'),
                },
              ]}
              csvName={`breakdown-${breakdown}-${breakdownBasis}.csv`}
            >
              {breakdownData.length > 0 ? (
                <RankBarChart
                  data={breakdownData}
                  theme={theme}
                  unit={unitFor(breakdownOption.unit, breakdownBasis)}
                  height={Math.max(240, breakdownData.length * 32)}
                />
              ) : (
                <p className="note">該当するデータがありません。</p>
              )}
            </ChartCard>

            <ChartCard
              title="系列比較（積み上げ・グループ棒グラフ）"
              note={[
                seriesOption.note || 'プレイヤーごとに複数系列を比較します。',
                basisNote(seriesBasis, '各プレイヤー'),
              ]
                .filter(Boolean)
                .join('')}
              actions={
                <>
                  <Picker label="比較軸" value={seriesId} options={SERIES_OPTIONS} onChange={setSeriesId} />
                  <Picker
                    label="値の基準"
                    value={seriesBasis}
                    options={BASIS_OPTIONS}
                    onChange={setSeriesBasis}
                  />
                </>
              }
              tableRows={seriesData.rows as Row[]}
              tableColumns={[
                { key: 'name', label: 'プレイヤー', align: 'left' },
                ...seriesData.series.map((s) => ({ key: s.key, label: s.label })),
              ]}
              csvName={`series-${seriesId}-${seriesBasis}.csv`}
            >
              {seriesData.rows.length > 0 ? (
                <SeriesBarChart
                  data={seriesData}
                  theme={theme}
                  stacked={seriesOption.stacked}
                  unit={unitFor(seriesOption.unit, seriesBasis)}
                />
              ) : (
                <p className="note">条件に合うプレイヤーがいません。</p>
              )}
            </ChartCard>

            <ChartCard
              title="日付ごとの推移（折れ線グラフ）"
              note={[
                `${formatInt(snapshots.length)} 日分のスナップショットを日付順につないでいます。`,
                snapshots.length < 2
                  ? 'データが1日分しかないため、点が1つだけ表示されます。data/ に別の日付の minecraft-stats-YYYYMMDD.json を追加すると線になります。'
                  : '',
                trendPerPlayer === 'per_player' ? '最新日の上位8人までを表示します。' : '',
                basisNote(trendBasis, '対象者'),
              ]
                .filter(Boolean)
                .join('')}
              actions={
                <>
                  <Picker
                    label="指標"
                    value={trendMetric}
                    options={metricsFor(trendBasis)}
                    onChange={setTrendMetric}
                  />
                  <Picker
                    label="表示単位"
                    value={trendPerPlayer}
                    options={[
                      { value: 'total' as const, label: '対象者の合計' },
                      { value: 'per_player' as const, label: 'プレイヤー別' },
                    ]}
                    onChange={setTrendPerPlayer}
                  />
                  <Picker
                    label="値の基準"
                    value={trendBasis}
                    options={BASIS_OPTIONS}
                    onChange={changeTrendBasis}
                  />
                </>
              }
              tableRows={trendData.rows as Row[]}
              tableColumns={[
                { key: TIMELINE_CATEGORY_KEY, label: '日付', align: 'left' },
                ...trendData.series.map((series) => ({ key: series.key, label: series.label })),
              ]}
              csvName={`trend-${trendMetric}-${trendBasis}.csv`}
            >
              {trendData.rows.length > 0 ? (
                <TrendLineChart
                  data={trendData}
                  theme={theme}
                  categoryKey={TIMELINE_CATEGORY_KEY}
                  unit={unitFor(trendMetricOption.unit, trendBasis)}
                />
              ) : (
                <p className="note">表示できるスナップショットがありません。</p>
              )}
            </ChartCard>

            <ChartCard
              title="2指標の関係（散布図）"
              note={
                scatterBasis === 'total'
                  ? '横軸・縦軸の指標をそれぞれ選べます。同じ指標を選ぶと対角線になります。'
                  : `両軸とも${basisNote(scatterBasis, '各プレイヤー')}`
              }
              actions={
                <>
                  <Picker
                    label="横軸"
                    value={scatterX}
                    options={metricsFor(scatterBasis)}
                    onChange={setScatterX}
                  />
                  <Picker
                    label="縦軸"
                    value={scatterY}
                    options={metricsFor(scatterBasis)}
                    onChange={setScatterY}
                  />
                  <Picker
                    label="値の基準"
                    value={scatterBasis}
                    options={BASIS_OPTIONS}
                    onChange={changeScatterBasis}
                  />
                </>
              }
              tableRows={scatterPoints.map<Row>((point) => ({
                player: point.name,
                x: point.x,
                y: point.y,
              }))}
              tableColumns={[
                PLAYER_COLUMN,
                { key: 'x', label: `${scatterXOption.label}${unitFor(scatterXOption.unit, scatterBasis)}` },
                { key: 'y', label: `${scatterYOption.label}${unitFor(scatterYOption.unit, scatterBasis)}` },
              ]}
              csvName={`scatter-${scatterX}-${scatterY}-${scatterBasis}.csv`}
            >
              {scatterPoints.length === 0 && <p className="note">条件に合うプレイヤーがいません。</p>}
              <MetricScatter
                points={scatterPoints}
                theme={theme}
                xLabel={scatterXOption.label}
                yLabel={scatterYOption.label}
                xUnit={unitFor(scatterXOption.unit, scatterBasis)}
                yUnit={unitFor(scatterYOption.unit, scatterBasis)}
              />
            </ChartCard>
          </>
        )}
      </main>

      {doc && (
        <footer className="app-foot">
          <span>
            取得元: {doc.source.path}（{doc.source.retrieved_via} / {doc.source.instance_id}）
          </span>
          <span>{doc.units.playtime}</span>
        </footer>
      )}
    </div>
  );
}
