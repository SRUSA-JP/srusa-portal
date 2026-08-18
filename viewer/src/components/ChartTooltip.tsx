import { tooltipSurface, type VizTheme } from '../theme/palette';

export interface TooltipRow {
  /** 行の見出し（系列名・軸名）。単一系列では省略できる。 */
  label?: string;
  /** 整形済みの値（単位込み）。 */
  value: string;
  /** 系列色。読める色へ補正してから凡例ドットに使う。 */
  color?: string;
}

export interface ChartTooltipProps {
  theme: VizTheme;
  /** 見出し（カテゴリ名・プレイヤー名）。 */
  title?: string;
  rows: TooltipRow[];
}

/**
 * すべてのグラフで共用するツールチップ。
 *
 * 色は `tooltipSurface()` だけが決める。ここでも呼び出し側でも色コードを書かない。
 * Recharts の既定ツールチップは系列色をそのまま文字色に使い、色が無いときは黒に
 * なるため、背景とのコントラストが保証できない。そのため描画ごと差し替えている。
 */
export function ChartTooltip({ theme, title, rows }: ChartTooltipProps) {
  const surface = tooltipSurface(theme);

  return (
    <div
      style={{
        background: surface.background,
        border: `1px solid ${surface.border}`,
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 12,
        color: surface.textColor,
        display: 'grid',
        gap: 2,
      }}
    >
      {title && (
        <strong style={{ color: surface.titleColor, fontWeight: 600 }}>{title}</strong>
      )}
      {rows.map((row, index) => (
        <div
          key={row.label ?? index}
          style={{ color: surface.textColor, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {row.color && (
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: surface.seriesColor(row.color),
                flex: '0 0 auto',
              }}
            />
          )}
          {row.label && <span>{row.label}</span>}
          <strong style={{ marginLeft: 'auto', fontWeight: 600 }}>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}
