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

// Reads a video file's real pixel dimensions before upload, so the profile
// page can size each video's card to match its actual aspect ratio instead
// of guessing (a portrait phone video forced into a landscape box, or vice
// versa, gets visibly cropped by Drive's embedded player).
export function getVideoDimensions(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = videoEl;
      URL.revokeObjectURL(url);
      if (videoWidth && videoHeight) {
        resolve({ width: videoWidth, height: videoHeight });
      } else {
        resolve(null);
      }
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    videoEl.src = url;
  });
}
