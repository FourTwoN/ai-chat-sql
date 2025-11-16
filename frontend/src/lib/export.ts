import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ExportData {
  columns: string[];
  rows: any[][];
}

export function exportToCSV(data: ExportData, filename: string = 'export.csv') {
  const csv = Papa.unparse({
    fields: data.columns,
    data: data.rows
  });

  downloadFile(csv, filename, 'text/csv');
}

export function exportToJSON(data: ExportData, filename: string = 'export.json') {
  // Convert to array of objects
  const jsonData = data.rows.map(row => {
    const obj: any = {};
    data.columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });

  const json = JSON.stringify(jsonData, null, 2);
  downloadFile(json, filename, 'application/json');
}

export function exportToExcel(data: ExportData, filename: string = 'export.xlsx') {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet format
  const wsData = [data.columns, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = data.columns.map((col, colIndex) => {
    const maxLength = Math.max(
      col.length,
      ...data.rows.map(row => {
        const cellValue = row[colIndex];
        return cellValue ? String(cellValue).length : 0;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Write file
  XLSX.writeFile(wb, filename);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDataForExport(columns: string[], rows: any[]): ExportData {
  return {
    columns,
    rows: rows.map(row =>
      columns.map(col => row[col])
    )
  };
}
