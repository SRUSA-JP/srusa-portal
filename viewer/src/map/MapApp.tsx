import { useMemo, useState } from 'react';
import { ChartCard } from '../components';
import { useVizTheme } from '../theme/useThemeMode';
import { EDGE_MODES, type EdgeMode } from './config';
import { loadRelationshipData } from './data';
import { groupTypeLabel, personLabel } from './display';
import { buildLayout } from './layout';
import { MapLegend } from './components/MapLegend';
import { RelationshipMap } from './components/RelationshipMap';

/** 画面上のプルダウン。統計ビューアと同じ見た目にそろえる。 */
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
    <label className="field">
      {label}
      <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MapApp() {
  const theme = useVizTheme();
  const source = useMemo(() => loadRelationshipData(), []);
  const data = source?.data ?? null;

  const [centerId, setCenterId] = useState(data?.view?.centerPersonId ?? data?.project.defaultCenterPersonId ?? '');
  const [highlightedGroupId, setHighlightedGroupId] = useState('');
  const [edgeMode, setEdgeMode] = useState<EdgeMode>('all');

  const layout = useMemo(() => (data ? buildLayout(data) : null), [data]);

  const edges = useMemo(() => {
    if (!layout) return [];
    if (edgeMode === 'none') return [];
    if (edgeMode === 'center') {
      return layout.edges.filter(
        (edge) => edge.relation.source === centerId || edge.relation.target === centerId,
      );
    }
    return layout.edges;
  }, [layout, edgeMode, centerId]);

  if (!data || !layout) {
    return (
      <div className="app">
        <p className="error">
          data/srusa-relationship-*.json が見つかりません。データを置いてからビルドし直してください。
        </p>
      </div>
    );
  }

  const nameMode = data.project.nameMode;
  const peopleOptions = [...data.people]
    .sort((a, b) => personLabel(a, nameMode).localeCompare(personLabel(b, nameMode), 'ja'))
    .map((person) => ({ value: person.id, label: personLabel(person, nameMode) }));

  const groupOptions = [
    { value: '', label: '強調しない' },
    ...layout.regions.map((region) => ({
      value: region.group.id,
      label: `${region.group.name}（${groupTypeLabel(region.group.type)}・${region.memberIds.length}人）`,
    })),
  ];

  const centerPerson = data.people.find((person) => person.id === centerId);

  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1>{data.project.name}</h1>
          <p className="note">
            {data.people.length} 人 / {layout.regions.length} グループ / {data.relations.length} 関係（データ{' '}
            {source?.version}）
          </p>
        </div>
      </header>

      {source && source.issues.length > 0 && (
        <p className="error">
          データの不整合: {source.issues.slice(0, 3).join(' ')}
          {source.issues.length > 3 ? ` ほか ${source.issues.length - 3} 件` : ''}
        </p>
      )}

      <main>
        <ChartCard
          title="相関図"
          note={[
            '所属の組み合わせが同じ人をまとめて配置し、各グループをその所属者を囲う領域として描いています。',
            '複数の所属は領域の重なりで表れます。',
            centerPerson ? `中心人物: ${personLabel(centerPerson, nameMode)}` : '',
          ]
            .filter(Boolean)
            .join('')}
          actions={
            <>
              <Picker label="中心人物" value={centerId} options={peopleOptions} onChange={setCenterId} />
              <Picker
                label="強調するグループ"
                value={highlightedGroupId}
                options={groupOptions}
                onChange={setHighlightedGroupId}
              />
              <Picker
                label="関係線"
                value={edgeMode}
                options={EDGE_MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
                onChange={setEdgeMode}
              />
            </>
          }
        >
          <div className="map-scroll">
            <RelationshipMap
              layout={layout}
              theme={theme}
              centerId={centerId}
              highlightedGroupId={highlightedGroupId}
              edges={edges}
              nameMode={nameMode}
              onSelectPerson={setCenterId}
            />
          </div>
        </ChartCard>

        <ChartCard title="グループ" note="クリックするとその領域を強調し、所属していない人を淡く表示します。">
          <MapLegend
            regions={layout.regions}
            theme={theme}
            highlightedGroupId={highlightedGroupId}
            onHighlight={setHighlightedGroupId}
          />
        </ChartCard>
      </main>

      {data.view?.notes && data.view.notes.length > 0 && (
        <footer className="app-foot">
          <span>{data.view.notes.join(' / ')}</span>
        </footer>
      )}
    </div>
  );
}
