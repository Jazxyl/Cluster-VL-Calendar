// Converts a normal Google Docs or Drive share link into its embeddable
// "/preview" form. Both link types share the same "/d/FILE_ID/" structure,
// they just differ in domain — so the same ID extraction works for either,
// and only the embed URL prefix needs to change based on which was pasted.
export function toEmbedUrl(rawUrl) {
  const url = (rawUrl || '').trim();
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return url;
  const id = idMatch[1];

  if (url.includes('docs.google.com/document')) {
    return `https://docs.google.com/document/d/${id}/preview`;
  }
  if (url.includes('drive.google.com/file')) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return url;
}
