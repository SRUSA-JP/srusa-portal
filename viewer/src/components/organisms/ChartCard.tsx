import { useState, type ReactNode } from 'react';
import { TABLE_TEXT } from '../../config/messages';
import { Button } from '../atoms';
import { SectionHeader } from '../molecules/SectionHeader';
import { DataTable, type Column } from './DataTable';
import type { Row } from '../../lib/export';

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
      <SectionHeader
        title={title}
        note={note}
        actions={
          <>
            {actions}
            {hasTable && (
              <Button
                label={showTable ? TABLE_TEXT.toggle.toChart : TABLE_TEXT.toggle.toTable}
                onClick={() => setShowTable((v) => !v)}
              />
            )}
          </>
        }
      />
      {showTable && hasTable ? (
        <DataTable rows={tableRows!} columns={tableColumns} csvName={csvName ?? `${title}.csv`} />
      ) : (
        <div className="card-body">{children}</div>
      )}
    </section>
  );
}
