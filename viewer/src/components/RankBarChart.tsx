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
import type { Entry } from '../lib/selectors';
import { formatCompact, formatDecimal, formatInt } from '../lib/format';
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
  height = 320,
  horizontal = true,
}: RankBarChartProps) {
  const base = theme.categorical[colorSlot % theme.categorical.length];
  const dim = mutedFill(theme);
  const axisColor = chartText(theme);
  const max = data.reduce((acc, e) => Math.max(acc, e.value), 0);
  const format = (value: number) => (Number.isInteger(value) ? formatInt(value) : formatDecimal(value));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
        barCategoryGap={horizontal ? '28%' : '24%'}
      >
        <CartesianGrid
          stroke={theme.grid}
          strokeDasharray="0"
          horizontal={!horizontal}
          vertical={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={formatCompact}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              interval={0}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="label"
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: 12 }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={72}
            />
            <YAxis
              type="number"
              tickFormatter={formatCompact}
              stroke={theme.grid}
              tick={{ fill: axisColor, fontSize: 12 }}
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
                rows={[{ value: `${format(Number(payload[0].value))}${unit}` }]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={highlightKey && entry.key !== highlightKey ? dim : base} />
          ))}
          {/* 全ての棒に数値を出す。単位は最大値にだけ付けて横幅を抑える */}
          <LabelList
            dataKey="value"
            position={horizontal ? 'right' : 'top'}
            fill={axisColor}
            fontSize={12}
            formatter={(value) =>
              Number(value) === max ? `${format(Number(value))}${unit}` : format(Number(value))
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
