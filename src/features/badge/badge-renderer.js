export const DEFAULT_BADGE_AVATAR = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280"><rect width="240" height="280" fill="#f8f1dd"/><circle cx="120" cy="90" r="52" fill="#1a3c5e"/><path d="M40 248c12-52 50-84 80-84s68 32 80 84" fill="#1a3c5e"/></svg>')}`;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

export function waitForImage(image) {
  if (!image) return Promise.reject(new Error('Badge image element is missing.'));
  if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      cleanup();
      resolve(image);
    };
    const handleError = () => {
      cleanup();
      reject(new Error('Badge image failed to load.'));
    };
    const cleanup = () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', handleError, { once: true });
  });
}
