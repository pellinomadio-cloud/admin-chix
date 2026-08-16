/**
 * Utility to compress image files and base64 strings to ensure fast uploads
 * and prevent Firestore document size limit (1MB) and localStorage quota exceeded errors.
 */

export async function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, try raw reader
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio resizing
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Fill white background in case of PNG transparency
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn("Canvas compression failed, falling back to original:", err);
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function compressBase64Image(base64Data: string, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return base64Data;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width <= maxWidth && height <= maxHeight && base64Data.length < 200000) {
          // Already compact enough
          resolve(base64Data);
          return;
        }

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Data);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("Base64 compression failed, fallback to original:", err);
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}
