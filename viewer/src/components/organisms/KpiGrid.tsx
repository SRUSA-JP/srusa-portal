import type { ReactNode } from 'react';

/** 指標タイルの並び。画面の幅に応じて折り返す。 */
export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="kpi-grid">{children}</div>;
}
