const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export function fileToBase64(file, maxBytes = MAX_FILE_BYTES) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`${file.name} is over the ${Math.round(maxBytes / (1024 * 1024))} MB limit`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1] || '';
      resolve({ data: base64, name: file.name, mimeType: file.type || 'application/octet-stream' });
    };
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
    reader.readAsDataURL(file);
  });
}
