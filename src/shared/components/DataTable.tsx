import type { ReactNode } from 'react';
import { EmptyState, Pagination } from './ui';
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  page,
  pageSize = 6,
  total,
  onPage,
  emptyAction,
}: {
  rows: T[];
  columns: Column<T>[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPage?: (page: number) => void;
  emptyAction?: ReactNode;
}) {
  return (
    <>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td className={c.className} data-label={c.label} key={c.key}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState action={emptyAction} />
      )}{' '}
      {onPage && (
        <Pagination page={page || 1} pageSize={pageSize} total={total || 0} onChange={onPage} />
      )}
    </>
  );
}
