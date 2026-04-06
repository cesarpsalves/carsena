/**
 * Browser-side image processing utilities using HTML5 Canvas.
 * This allows generating previews and thumbnails before upload,
 * saving bandwidth and server costs.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/webp";
  watermarkText?: string;
}

/**
 * Applies a repeating watermark over the canvas
 */
export const applyWatermark = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
) => {
  const fontSize = Math.max(16, Math.floor(width / 30));
  ctx.save();
  ctx.font = `${fontSize}px "Outfit", sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 0.5;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Diagonal pattern
  const stepX = width / 2.5;
  const stepY = height / 4;

  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 8); 

  for (let x = -width * 1.5; x < width * 1.5; x += stepX) {
    for (let y = -height * 1.5; y < height * 1.5; y += stepY) {
      ctx.fillText(text, x, y);
      ctx.strokeText(text, x, y);
    }
  }
  ctx.restore();
};

/**
 * Resizes an image file and returns a new Blob
 */
export const resizeImage = async (
  file: File,
  options: ResizeOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "image/webp",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Draw and resize
        ctx.drawImage(img, 0, 0, width, height);

        // Apply watermark if provided
        if (options.watermarkText) {
          applyWatermark(ctx, width, height, options.watermarkText);
        }

        // Export to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate blob"));
            }
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Generates a thumbnail (optimized for grid view)
 */
export const generateThumbnail = async (file: File): Promise<Blob> => {
  return resizeImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.7,
    format: "image/webp",
  });
};

/**
 * Generates a preview (optimized for full-screen view)
 */
export const generatePreview = async (file: File): Promise<Blob> => {
  return resizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    format: "image/webp",
  });
};
