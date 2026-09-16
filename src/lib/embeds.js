export function toEmbedUrl(rawUrl) {
  const url = (rawUrl || '').trim();
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return url;
  const id = idMatch[1];
  if (url.includes('docs.google.com/document')) return `https://docs.google.com/document/d/${id}/preview`;
  if (url.includes('drive.google.com/file')) return `https://drive.google.com/file/d/${id}/preview`;
  return url;
}
