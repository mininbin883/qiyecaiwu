import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, emptyText = '暂无数据' }: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyText?: string;
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={column.className}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center text-slate-400 py-10">
              {emptyText}
            </td>
          </tr>
        ) : rows.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key} className={column.className}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

