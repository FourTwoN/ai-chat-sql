import React, { useState } from 'react';
import { exportToCSV, exportToJSON, exportToExcel, formatDataForExport } from '../lib/export';

interface ExportButtonProps {
  data: {
    columns: string[];
    rows: any[];
  };
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, filename = 'export' }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    const exportData = formatDataForExport(data.columns, data.rows);

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `${filename}.csv`);
        break;
      case 'json':
        exportToJSON(exportData, `${filename}.json`);
        break;
      case 'excel':
        exportToExcel(exportData, `${filename}.xlsx`);
        break;
    }

    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
        title="Export data"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="font-medium">Export</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-gray-500">Comma-separated values</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <div>
                <div className="font-medium">Export as JSON</div>
                <div className="text-xs text-gray-500">JavaScript object notation</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">Export as Excel</div>
                <div className="text-xs text-gray-500">Microsoft Excel format</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
