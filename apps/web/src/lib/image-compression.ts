type ImageCompressionOptions = {
  maxDimension?: number;
  outputType?: "image/webp";
  quality?: number;
};

type ImageCompressionResult = {
  compressed: boolean;
  file: File;
  finalSize: number;
  originalSize: number;
};

const COMPRESSIBLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const DEFAULT_OPTIONS = {
  maxDimension: 1920,
  outputType: "image/webp" as const,
  quality: 0.82,
};

export async function prepareImageForUpload(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) {
    return original(file);
  }

  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return original(file);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return original(file);
  }

  try {
    const scale = Math.min(1, settings.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return original(file);
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, settings.outputType, settings.quality);
    if (!blob || blob.size >= file.size) {
      return original(file);
    }

    return {
      compressed: true,
      file: new File([blob], file.name, {
        lastModified: file.lastModified,
        type: blob.type || settings.outputType,
      }),
      finalSize: blob.size,
      originalSize: file.size,
    };
  } finally {
    bitmap.close();
  }
}

function original(file: File): ImageCompressionResult {
  return {
    compressed: false,
    file,
    finalSize: file.size,
    originalSize: file.size,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}
