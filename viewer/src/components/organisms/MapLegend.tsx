import { Swatch } from '../atoms';
import { LEGEND } from '../../map/config';
import { groupLabel, groupTypeLabel, regionStyle } from '../../map/display';
import type { RegionPlacement } from '../../map/layout';
import type { VizTheme } from '../../theme/palette';

export interface MapLegendProps {
  regions: RegionPlacement[];
  theme: VizTheme;
  highlightedGroupId: string;
  onHighlight: (groupId: string) => void;
}

/** 分類ごとにまとめた凡例。クリックでその領域を強調する。 */
export function MapLegend({ regions, theme, highlightedGroupId, onHighlight }: MapLegendProps) {
  const byType = new Map<string, RegionPlacement[]>();
  for (const region of regions) {
    const list = byType.get(region.group.type) ?? [];
    list.push(region);
    byType.set(region.group.type, list);
  }

  return (
    <div className="legend">
      {[...byType.entries()].map(([type, group]) => (
        <div key={type} className="legend-group">
          <span className="legend-title" style={{ fontSize: LEGEND.fontSize }}>
            {groupTypeLabel(type)}
          </span>
          <div className="legend-items">
            {group.map((region) => {
              const active = region.group.id === highlightedGroupId;
              const style = regionStyle(region.group, theme, active);
              return (
                <button
                  key={region.group.id}
                  type="button"
                  className={active ? 'legend-item active' : 'legend-item'}
                  aria-pressed={active}
                  onClick={() => onHighlight(active ? '' : region.group.id)}
                  style={{ fontSize: LEGEND.fontSize, color: style.labelColor }}
                >
                  <Swatch
                    className="legend-swatch"
                    size={LEGEND.swatchSize}
                    background={style.fill}
                    borderColor={style.stroke}
                  />
                  {groupLabel(region.group)}
                  <span className="legend-count">{region.memberIds.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
