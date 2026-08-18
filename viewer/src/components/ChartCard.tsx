import { useState, type ReactNode } from 'react';
import { DataTable, type Column } from './DataTable';
import type { Row } from '../lib/export';

export interface ChartCardProps {
  title: string;
  /** グラフの読み方や注意点。 */
  note?: string;
  /** 表ビュー用のデータ。渡すと「表」トグルと CSV 出力が有効になる。 */
  tableRows?: Row[];
  tableColumns?: Column[];
  /** CSV のファイル名（拡張子込み）。 */
  csvName?: string;
  /** ヘッダー右側に置く操作 UI（フィルタなど）。 */
  actions?: ReactNode;
  children: ReactNode;
}

/** グラフ 1 枚 + 表ビュー + CSV 書き出しをまとめたカード。 */
export function ChartCard({ title, note, tableRows, tableColumns, csvName, actions, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const hasTable = Boolean(tableRows && tableRows.length > 0);

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>{title}</h3>
          {note && <p className="note">{note}</p>}
        </div>
        <div className="card-actions">
          {actions}
          {hasTable && (
            <button type="button" className="ghost" onClick={() => setShowTable((v) => !v)}>
              {showTable ? 'グラフ' : '表'}
            </button>
          )}
        </div>
      </header>
      {showTable && hasTable ? (
        <DataTable rows={tableRows!} columns={tableColumns} csvName={csvName ?? `${title}.csv`} />
      ) : (
        <div className="card-body">{children}</div>
      )}
    </section>
  );
}
