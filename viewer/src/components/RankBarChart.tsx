import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS, BAR, CHART_HEIGHT, CHART_MARGIN, GRID_DASH } from '../config/charts';
import type { Entry } from '../lib/selectors';
import { formatValue, formatWithUnit } from '../lib/display';
import { formatCompact } from '../lib/format';
import { chartText, cursorFill, mutedFill, type VizTheme } from '../theme/palette';
import { ChartTooltip } from './ChartTooltip';

export interface RankBarChartProps {
  data: Entry[];
  theme: VizTheme;
  /** 単一系列なので既定はスロット 1。強調したい実体があるときだけ変える。 */
  colorSlot?: number;
  /** 強調表示するキー（選択中のプレイヤーなど）。他はグレーにはせず彩度そのまま。 */
  highlightKey?: string;
  unit?: string;
  height?: number;
  /** 縦棒にする場合は false。 */
  horizontal?: boolean;
}

/** 単一系列のランキング用棒グラフ。最大値のみ直接ラベルを出す。 */
export function RankBarChart({
  data,
  theme,
  colorSlot = 0,
  highlightKey,
  unit = '',
  height = CHART_HEIGHT.compact,
  horizontal = true,
}: RankBarChartProps) {
  const base = theme.categorical[colorSlot % theme.categorical.length];
  const dim = mutedFill(theme);
  const axisColor = chartText(theme);
  const max = data.reduce((acc, e) => Math.max(acc, e.value), 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={CHART_MARGIN.bar}
        barCategoryGap={horizontal ? BAR.categoryGap.horizontal : BAR.categoryGap.vertical}
      >
        <CartesianGrid
          stroke={theme.grid}
          strokeDasharray={GRID_DASH}
          horizontal={!horizontal}
          vertical={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={formatCompact}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={AXIS.categoryWidth}
              interval={0}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="label"
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
              interval={0}
              angle={AXIS.tickAngle}
              textAnchor="end"
              height={AXIS.tickHeight}
            />
            <YAxis
              type="number"
              tickFormatter={formatCompact}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: AXIS.fontSize }}
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: cursorFill(theme) }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                theme={theme}
                title={String(label)}
                rows={[{ value: formatWithUnit(Number(payload[0].value), unit) }]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="value"
          radius={horizontal ? [0, BAR.radius, BAR.radius, 0] : [BAR.radius, BAR.radius, 0, 0]}
          isAnimationActive={false}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={highlightKey && entry.key !== highlightKey ? dim : base} />
          ))}
          {/* 全ての棒に数値を出す。単位は最大値にだけ付けて横幅を抑える */}
          <LabelList
            dataKey="value"
            position={horizontal ? 'right' : 'top'}
            fill={axisColor}
            fontSize={AXIS.fontSize}
            formatter={(value) =>
              Number(value) === max ? formatWithUnit(Number(value), unit) : formatValue(Number(value))
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
