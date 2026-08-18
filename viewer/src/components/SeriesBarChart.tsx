import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StackedSeries } from '../lib/selectors';
import { formatCompact, formatDecimal, formatInt } from '../lib/format';
import { chartText, colorScale, cursorFill, readableTextOn, type VizTheme } from '../theme/palette';
import { ChartTooltip } from './ChartTooltip';

export interface SeriesBarChartProps {
  data: StackedSeries;
  theme: VizTheme;
  /** 積み上げ（true, 既定）か横並び（false）か。 */
  stacked?: boolean;
  /** カテゴリ軸に使う列。既定は `name`。 */
  categoryKey?: string;
  unit?: string;
  height?: number;
  /**
   * 積み上げ時に値ラベルを出す下限（棒全体の最大値に対する比率）。
   * 細いセグメントに数字が重なるのを防ぐ。
   */
  labelThreshold?: number;
}

/**
 * 複数系列の棒グラフ（積み上げ / 横並び）。
 * 系列の色は登録順で固定するので、系列を絞っても残りの色は変わらない。
 */
export function SeriesBarChart({
  data,
  theme,
  stacked = true,
  categoryKey = 'name',
  unit = '',
  height = 380,
  labelThreshold = 0.06,
}: SeriesBarChartProps) {
  const color = colorScale(
    data.series.map((s) => s.key),
    theme,
  );
  const axisColor = chartText(theme);
  const format = (value: number) => (Number.isInteger(value) ? formatInt(value) : formatDecimal(value));

  /* 積み上げの各セグメントに数字を置くので、細すぎる分だけ間引く基準を作る */
  const maxTotal = data.rows.reduce((acc, row) => {
    const total = data.series.reduce((sum, s) => sum + Number(row[s.key] ?? 0), 0);
    return Math.max(acc, total);
  }, 0);
  const minLabelValue = maxTotal * labelThreshold;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.rows} margin={{ top: 20, right: 16, bottom: 56, left: 8 }} barCategoryGap="22%">
        <CartesianGrid stroke={theme.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey={categoryKey}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={72}
        />
        <YAxis
          tickFormatter={formatCompact}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: cursorFill(theme) }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                theme={theme}
                title={String(label)}
                rows={payload.map((item) => ({
                  label: String(item.name),
                  value: `${format(Number(item.value))}${unit}`,
                  color: typeof item.color === 'string' ? item.color : undefined,
                }))}
              />
            ) : null
          }
        />
        <Legend wrapperStyle={{ color: axisColor, fontSize: 12, paddingTop: 8 }} />
        {data.series.map((series, index) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            name={series.label}
            stackId={stacked ? 'total' : undefined}
            fill={color(series.key)}
            /* 隣接セグメントの間に 2px の背景色の隙間を作る（枠線ではなく余白として） */
            stroke={stacked ? theme.surface : undefined}
            strokeWidth={stacked ? 2 : 0}
            radius={stacked && index === data.series.length - 1 ? [4, 4, 0, 0] : undefined}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={series.key}
              position={stacked ? 'center' : 'top'}
              /* 積み上げは色面の上に載るので、その塗りに対して読める色を都度求める */
              fill={stacked ? readableTextOn(color(series.key), theme) : axisColor}
              fontSize={11}
              formatter={(value) => {
                const numeric = Number(value);
                if (!numeric) return '';
                if (stacked && numeric < minLabelValue) return '';
                return format(numeric);
              }}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
