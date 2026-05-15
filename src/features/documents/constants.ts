export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.pdf',
  '.bmp',
  '.tiff',
  '.webp',
  '.doc',
  '.docx',
  '.html',
  '.mhtml',
  '.xls',
  '.xlsx',
  '.csv',
  '.ppt',
  '.pptx',
  '.txt',
  '.ofd',
  '.rtf',
] as const;

const ACCEPTED_MIME_EXACT = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'text/rtf',
  'text/html',
  'text/plain',
  'text/csv',
  'multipart/related',
  'message/rfc822',
  'image/png',
  'image/jpeg',
  'image/bmp',
  'image/tiff',
  'image/webp',
]);

export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

export function isAcceptedFile(file: File): boolean {
  if (file.type && ACCEPTED_MIME_EXACT.has(file.type)) return true;
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/webp': '.webp',
};

const IMAGE_EXTENSIONS = new Set<string>([
  '.png',
  '.jpg',
  '.jpeg',
  '.bmp',
  '.tiff',
  '.webp',
]);

export function isImageFile(file: File): boolean {
  if (file.type && IMAGE_MIME_TO_EXT[file.type]) return true;
  const lowerName = file.name.toLowerCase();
  for (const ext of IMAGE_EXTENSIONS) {
    if (lowerName.endsWith(ext)) return true;
  }
  return false;
}

export const IMAGE_DIMENSION_MIN = 20;
export const IMAGE_DIMENSION_MAX_TALL = 20000;
export const IMAGE_DIMENSION_MAX_NORMAL = 10000;

export interface ImageDimensionCheck {
  valid: boolean;
  width?: number;
  height?: number;
}

export function validateImageDimensions(file: File): Promise<ImageDimensionCheck> {
  return new Promise((resolve) => {
    if (!isImageFile(file)) {
      resolve({ valid: true });
      return;
    }
    // TIFF is not renderable by browsers — skip client-side dimension check.
    const lowerName = file.name.toLowerCase();
    if (file.type === 'image/tiff' || lowerName.endsWith('.tiff')) {
      resolve({ valid: true });
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      const longer = Math.max(width, height);
      const shorter = Math.min(width, height);
      if (shorter === 0) {
        resolve({ valid: false, width, height });
        return;
      }
      const ratio = longer / shorter;
      const upperBound =
        ratio < 2 ? IMAGE_DIMENSION_MAX_TALL : IMAGE_DIMENSION_MAX_NORMAL;
      const valid =
        width >= IMAGE_DIMENSION_MIN &&
        height >= IMAGE_DIMENSION_MIN &&
        width <= upperBound &&
        height <= upperBound;
      resolve({ valid, width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If the browser can't decode it, don't block the upload — the server
      // will reject it if truly invalid.
      resolve({ valid: true });
    };
    img.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const precision = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}
