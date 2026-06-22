function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(filename: string, rows: object[]): void {
  if (rows.length === 0) {
    window.alert('暂无可导出的数据');
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => {
      const record = row as Record<string, unknown>;
      return headers.map((header) => escapeCsvCell(record[header])).join(',');
    }),
  ];

  const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
