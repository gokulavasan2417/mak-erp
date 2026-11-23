// MAK Tours & Travels ERP - Image Utility Helpers
// Resizes and compresses images client-side to ensure rapid rendering and stay safely within localStorage & MongoDB limits

export function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = {}) {
  return new Promise((resolve) => {
    if (!file) {
      return resolve('');
    }

    // If it's already a string (URL or base64 data URI)
    if (typeof file === 'string') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => {
      resolve('');
    };

    reader.onload = (event) => {
      const src = event.target?.result;
      if (!src || typeof src !== 'string') {
        return resolve('');
      }

      // If svg or gif, avoid canvas rasterization to keep quality
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return resolve(src);
      }

      const img = new Image();
      img.onerror = () => {
        resolve(src); // Fallback to uncompressed base64 if image decode fails
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(src);
          }

          // Draw with high quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Use image/jpeg for photos with high compression efficiency
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch (e) {
          console.warn('Canvas image compression failed, using original:', e);
          resolve(src);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}
