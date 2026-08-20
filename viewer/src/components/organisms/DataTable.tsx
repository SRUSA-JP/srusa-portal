import { useMemo, useState } from 'react';
import { TABLE_TEXT } from '../../config/messages';
import { Button } from '../atoms';
import { downloadCsv, type Row } from '../../lib/export';
import { formatValue } from '../../lib/display';

export interface Column {
  key: string;
  label: string;
  /** 既定: 数値なら右寄せ。 */
  align?: 'left' | 'right';
}

export interface DataTableProps {
  rows: Row[];
  columns?: Column[];
  csvName?: string;
  /** 既定の並び替えキー。 */
  initialSort?: string;
}

function formatCell(value: Row[string]): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return formatValue(value);
  return value;
}

/** 並び替え・CSV 出力に対応した素の表。どのグラフの裏側でも使える。 */
export function DataTable({ rows, columns, csvName = TABLE_TEXT.defaultCsvName, initialSort }: DataTableProps) {
  const cols: Column[] = useMemo(
    () =>
      columns ??
      Object.keys(rows[0] ?? {}).map((key) => ({
        key,
        label: key,
        align: typeof rows[0]?.[key] === 'number' ? ('right' as const) : ('left' as const),
      })),
    [columns, rows],
  );
  const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(
    initialSort ? { key: initialSort, desc: true } : null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const factor = sort.desc ? -1 : 1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor;
      return String(x ?? '').localeCompare(String(y ?? ''), 'ja') * factor;
    });
  }, [rows, sort]);

  return (
    <div className="table-wrap">
      <div className="table-actions">
        <Button
          label={TABLE_TEXT.exportCsv}
          onClick={() => downloadCsv(csvName, sorted, cols.map((c) => c.key))}
        />
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={col.align ?? 'right'}
                  onClick={() => setSort((s) => ({ key: col.key, desc: s?.key === col.key ? !s.desc : true }))}
                >
                  {col.label}
                  {sort?.key === col.key
                    ? sort.desc
                      ? TABLE_TEXT.sortMark.desc
                      : TABLE_TEXT.sortMark.asc
                    : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={String(row[cols[0].key] ?? index)}>
                {cols.map((col) => (
                  <td key={col.key} className={col.align ?? 'right'}>
                    {formatCell(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
