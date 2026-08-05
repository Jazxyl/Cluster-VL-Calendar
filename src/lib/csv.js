// Minimal CSV parser (handles quoted fields, commas, and embedded newlines) —
// no dependency needed for the simple flat data this app uses.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Converts parsed rows into an array of objects keyed by the header row.
export function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

export async function fetchTabAsObjects(url, expectedHeader) {
  if (!url) return [];
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);

  // Google's CSV export silently falls back to serving a DIFFERENT tab's
  // data if the requested tab name doesn't exist, instead of erroring. That's
  // dangerous — it can quietly show the wrong sheet's content as if it were
  // correct. If we know what the first header should be, verify it matches
  // before accepting the data; otherwise treat it as if the tab is empty.
  if (expectedHeader) {
    const firstHeader = (rows[0]?.[0] || '').trim();
    if (firstHeader !== expectedHeader) return [];
  }

  return rowsToObjects(rows);
}
