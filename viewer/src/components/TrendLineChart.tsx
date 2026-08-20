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
import { AXIS, CHART_HEIGHT, CHART_MARGIN, GRID_DASH, LEGEND, LINE, VALUE_LABEL } from '../config/charts';
import type { StackedSeries } from '../lib/selectors';
import { formatValue, formatWithUnit } from '../lib/display';
import { formatCompact } from '../lib/format';
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
  height = CHART_HEIGHT.base,
  showValueLabels = true,
}: TrendLineChartProps) {
  const color = colorScale(
    data.series.map((s) => s.key),
    theme,
  );
  const axisColor = chartText(theme);
  const multiSeries = data.series.length > 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data.rows} margin={CHART_MARGIN.line}>
        <CartesianGrid stroke={theme.grid} strokeDasharray={GRID_DASH} vertical={false} />
        <XAxis
          dataKey={categoryKey}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
          interval={0}
        />
        <YAxis
          tickFormatter={formatCompact}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
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
                  value: formatWithUnit(Number(item.value), unit),
                  color: typeof item.color === 'string' ? item.color : undefined,
                }))}
              />
            ) : null
          }
        />
        {multiSeries && (
          <Legend
            wrapperStyle={{ color: axisColor, fontSize: LEGEND.fontSize, paddingTop: LEGEND.paddingTop }}
          />
        )}
        {data.series.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            name={series.label}
            stroke={color(series.key)}
            strokeWidth={LINE.width}
            dot={{
              r: LINE.dotRadius,
              fill: color(series.key),
              stroke: theme.surface,
              strokeWidth: LINE.dotStrokeWidth,
            }}
            activeDot={{ r: LINE.activeDotRadius }}
            isAnimationActive={false}
          >
            {showValueLabels && !multiSeries && (
              <LabelList
                dataKey={series.key}
                position="top"
                offset={VALUE_LABEL.offset}
                fill={axisColor}
                fontSize={VALUE_LABEL.fontSize}
                formatter={(value) => formatValue(Number(value))}
              />
            )}
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
