export interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
}

/** 「数字そのものが主役」の指標はグラフにせずタイルで見せる。 */
export function KpiTile({ label, value, sub }: KpiTileProps) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}
