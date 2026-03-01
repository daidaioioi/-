import { BeadColor } from '../constants';

const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
};

const findClosestColor = (r: number, g: number, b: number, palette: BeadColor[]): BeadColor => {
  let minDistance = Infinity;
  let closest = palette[0];
  for (const color of palette) {
    const distance = colorDistance(r, g, b, color.rgb[0], color.rgb[1], color.rgb[2]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }
  return closest;
};

/**
 * Core image processing algorithm
 * 1. Scales image using Canvas (physical pixelation)
 * 2. Maps each pixel to the closest bead color using RGB Euclidean distance
 */
export const processImage = async (
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
  palette: BeadColor[]
): Promise<BeadColor[][]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // 1. Physical Pixelation: Scale and draw to canvas
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 2. Color Quantization: Get pixel data and map to palette
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const grid: BeadColor[][] = [];

      for (let y = 0; y < targetHeight; y++) {
        const row: BeadColor[] = [];
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          const a = imageData.data[idx + 3];

          // Handle transparency or near-white background as EMPTY
          if (a < 128 || (r > 250 && g > 250 && b > 250)) {
            row.push({ id: 'EMPTY', name: '空白', hex: 'transparent', rgb: [255, 255, 255] } as BeadColor);
          } else {
            const closestColor = findClosestColor(r, g, b, palette);
            row.push(closestColor);
          }
        }
        grid.push(row);
      }
      resolve(grid);
    };
    img.onerror = (err) => reject(err);
  });
};
