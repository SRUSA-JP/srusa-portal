import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StackedSeries } from '../lib/selectors';
import { formatCompact, formatDecimal, formatInt } from '../lib/format';
import { chartText, colorScale, cursorFill, type VizTheme } from '../theme/palette';
import { ChartTooltip } from './ChartTooltip';

export interface TrendLineChartProps {
  data: StackedSeries;
  theme: VizTheme;
  /** 横軸に使う列。既定は日付列。 */
  categoryKey?: string;
  unit?: string;
  height?: number;
  /** 点が 1 つしかない系列でも見えるように、点は常に描く。 */
  showValueLabels?: boolean;
}

/** 日付など順序のあるカテゴリを横軸にした折れ線グラフ。 */
export function TrendLineChart({
  data,
  theme,
  categoryKey = 'date',
  unit = '',
  height = 340,
  showValueLabels = true,
}: TrendLineChartProps) {
  const color = colorScale(
    data.series.map((s) => s.key),
    theme,
  );
  const axisColor = chartText(theme);
  const format = (value: number) => (Number.isInteger(value) ? formatInt(value) : formatDecimal(value));
  const multiSeries = data.series.length > 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data.rows} margin={{ top: 20, right: 24, bottom: 16, left: 8 }}>
        <CartesianGrid stroke={theme.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey={categoryKey}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
          interval={0}
        />
        <YAxis
          tickFormatter={formatCompact}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ stroke: theme.grid, fill: cursorFill(theme) }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                theme={theme}
                title={String(label)}
                rows={payload.map((item) => ({
                  label: multiSeries ? String(item.name) : undefined,
                  value: `${format(Number(item.value))}${unit}`,
                  color: typeof item.color === 'string' ? item.color : undefined,
                }))}
              />
            ) : null
          }
        />
        {multiSeries && <Legend wrapperStyle={{ color: axisColor, fontSize: 12, paddingTop: 8 }} />}
        {data.series.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={color(series.key)}
            strokeWidth={2}
            dot={{ r: 3, fill: color(series.key), stroke: theme.surface, strokeWidth: 1 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          >
            {showValueLabels && !multiSeries && (
              <LabelList
                dataKey={series.key}
                position="top"
                offset={8}
                fill={axisColor}
                fontSize={11}
                formatter={(value) => format(Number(value))}
              />
            )}
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
