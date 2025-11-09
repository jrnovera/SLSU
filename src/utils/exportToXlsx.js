import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an XLSX file.
 *
 * @param {Object} options
 * @param {Array} options.data - The raw array to export.
 * @param {Array} options.columns - Column configs: { label, value }.
 *   - `label` => column header text.
 *   - `value` => string key or (item, index) => value resolver.
 * @param {string} [options.filename='export.xlsx'] - Target filename.
 * @param {string} [options.sheetName='Data'] - Worksheet name.
 */
export function exportToXlsx({
  data = [],
  columns = [],
  filename = 'export.xlsx',
  sheetName = 'Data',
}) {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data to export yet.');
    return;
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('exportToXlsx requires at least one column definition.');
  }

  const normalizedRows = data.map((item, index) => {
    const row = {};
    columns.forEach(({ label, value }) => {
      const resolvedValue =
        typeof value === 'function'
          ? value(item, index)
          : item?.[value] ?? '';
      row[label] =
        resolvedValue === undefined || resolvedValue === null
          ? ''
          : resolvedValue;
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const safeFilename = filename.endsWith('.xlsx')
    ? filename
    : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename, { compression: true });
}

export default exportToXlsx;
