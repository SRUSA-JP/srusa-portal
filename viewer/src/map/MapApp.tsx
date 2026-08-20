import { useMemo, useState } from 'react';
import { ChartCard, Picker } from '../components';
import { joinNotes } from '../lib/display';
import { useVizTheme } from '../theme/useThemeMode';
import { MAP_TEXT } from '../config/messages';
import { EDGE_MODES, ISSUE_PREVIEW_COUNT, type EdgeMode } from './config';
import { loadRelationshipData } from './data';
import { groupTypeLabel, personLabel } from './display';
import { buildLayout } from './layout';
import { MapLegend } from './components/MapLegend';
import { RelationshipMap } from './components/RelationshipMap';

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
        <p className="error">{MAP_TEXT.noData}</p>
      </div>
    );
  }

  const nameMode = data.project.nameMode;
  const peopleOptions = [...data.people]
    .sort((a, b) => personLabel(a, nameMode).localeCompare(personLabel(b, nameMode), 'ja'))
    .map((person) => ({ value: person.id, label: personLabel(person, nameMode) }));

  const groupOptions = [
    { value: '', label: MAP_TEXT.picker.noHighlight },
    ...layout.regions.map((region) => ({
      value: region.group.id,
      label: MAP_TEXT.picker.groupOption(
        region.group.name,
        groupTypeLabel(region.group.type),
        region.memberIds.length,
      ),
    })),
  ];

  const centerPerson = data.people.find((person) => person.id === centerId);

  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1>{data.project.name}</h1>
          <p className="note">
            {MAP_TEXT.summary(
              data.people.length,
              layout.regions.length,
              data.relations.length,
              source?.version ?? '',
            )}
          </p>
        </div>
      </header>

      {source && source.issues.length > 0 && (
        <p className="error">
          {MAP_TEXT.issues(
            source.issues.slice(0, ISSUE_PREVIEW_COUNT),
            Math.max(0, source.issues.length - ISSUE_PREVIEW_COUNT),
          )}
        </p>
      )}

      <main>
        <ChartCard
          title={MAP_TEXT.card.map.title}
          note={joinNotes(
            MAP_TEXT.card.map.note,
            centerPerson && MAP_TEXT.card.map.center(personLabel(centerPerson, nameMode)),
          )}
          actions={
            <>
              <Picker
                showLabel
                label={MAP_TEXT.picker.center}
                value={centerId}
                options={peopleOptions}
                onChange={setCenterId}
              />
              <Picker
                showLabel
                label={MAP_TEXT.picker.group}
                value={highlightedGroupId}
                options={groupOptions}
                onChange={setHighlightedGroupId}
              />
              <Picker
                showLabel
                label={MAP_TEXT.picker.edges}
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

        <ChartCard title={MAP_TEXT.card.legend.title} note={MAP_TEXT.card.legend.note}>
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
