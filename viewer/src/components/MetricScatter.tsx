import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { ScatterPoint } from '../lib/selectors';
import { formatCompact, formatDecimal } from '../lib/format';
import { chartText, cursorFill, type VizTheme } from '../theme/palette';
import { ChartTooltip } from './ChartTooltip';

export interface MetricScatterProps {
  points: ScatterPoint[];
  theme: VizTheme;
  /** 横軸の指標名。 */
  xLabel: string;
  /** 縦軸の指標名。 */
  yLabel: string;
  /** 軸ラベルとツールチップに添える単位（例: ' h'）。 */
  xUnit?: string;
  yUnit?: string;
  /** 点に値ラベルを出すか。点が多くて重なるときは false にする。 */
  showValueLabels?: boolean;
  height?: number;
}

/** 軸の指標を呼び出し側が決める散布図。単一系列なので凡例は不要（軸名が系列名）。 */
export function MetricScatter({
  points,
  theme,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  showValueLabels = true,
  height = 340,
}: MetricScatterProps) {
  const axisColor = chartText(theme);
  const axisTitle = (label: string, unit: string) => (unit.trim() ? `${label}（${unit.trim()}）` : label);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 24, bottom: 48, left: 12 }}>
        <CartesianGrid stroke={theme.grid} strokeDasharray="0" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
          tickFormatter={formatCompact}
          label={{
            value: axisTitle(xLabel, xUnit),
            position: 'insideBottom',
            offset: -18,
            fill: axisColor,
            fontSize: 12,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          stroke={theme.grid}
          tick={{ fill: axisColor, fontSize: 12 }}
          tickFormatter={formatCompact}
          label={{
            value: axisTitle(yLabel, yUnit),
            angle: -90,
            position: 'insideLeft',
            fill: axisColor,
            fontSize: 12,
          }}
        />
        <ZAxis range={[90, 90]} />
        <Tooltip
          cursor={{ stroke: theme.grid, fill: cursorFill(theme) }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as ScatterPoint;
            return (
              <ChartTooltip
                theme={theme}
                title={point.name}
                rows={[
                  { label: xLabel, value: `${formatDecimal(point.x)}${xUnit}` },
                  { label: yLabel, value: `${formatDecimal(point.y)}${yUnit}` },
                ]}
              />
            );
          }}
        />
        <Scatter
          data={points}
          fill={theme.categorical[0]}
          stroke={theme.surface}
          strokeWidth={2}
          isAnimationActive={false}
        >
          {/* 点の上に縦軸の値、下に名前。どちらもグラフ面の上なので chartText を使う */}
          {showValueLabels && (
            <LabelList
              dataKey="y"
              position="top"
              offset={8}
              fill={axisColor}
              fontSize={11}
              formatter={(value) => formatDecimal(Number(value))}
            />
          )}
          <LabelList dataKey="name" position="bottom" offset={8} fill={axisColor} fontSize={10} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
