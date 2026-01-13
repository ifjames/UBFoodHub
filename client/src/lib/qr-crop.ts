/**
 * Utility to auto-crop GCash QR code from screenshot
 * GCash screenshots have a blue background with a white card containing the QR code
 */

export async function cropGcashQrCode(imageFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw the full image to analyze it
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data to find the QR code area
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Find QR code boundaries by looking for black pixels (the QR code pattern)
          // QR codes have distinctive black squares in corners
          let qrMinX = canvas.width;
          let qrMaxX = 0;
          let qrMinY = canvas.height;
          let qrMaxY = 0;
          
          // First, find where black pixels are concentrated (the QR code)
          // Black pixels have R, G, B all < 50
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Check if pixel is black/near-black (QR code pattern)
              // Also exclude the blue GCash header (high blue value)
              if (r < 60 && g < 60 && b < 100) {
                if (x < qrMinX) qrMinX = x;
                if (x > qrMaxX) qrMaxX = x;
                if (y < qrMinY) qrMinY = y;
                if (y > qrMaxY) qrMaxY = y;
              }
            }
          }

          // If no QR code found, return original
          if (qrMinX >= qrMaxX || qrMinY >= qrMaxY) {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            }, 'image/png', 0.95);
            return;
          }

          // Add padding around the QR code
          const padding = Math.max(20, (qrMaxX - qrMinX) * 0.08);
          qrMinX = Math.max(0, qrMinX - padding);
          qrMinY = Math.max(0, qrMinY - padding);
          qrMaxX = Math.min(canvas.width, qrMaxX + padding);
          qrMaxY = Math.min(canvas.height, qrMaxY + padding);

          // Calculate dimensions - make it square
          const width = qrMaxX - qrMinX;
          const height = qrMaxY - qrMinY;
          const size = Math.max(width, height);
          
          // Center the crop
          const centerX = qrMinX + width / 2;
          const centerY = qrMinY + height / 2;
          const cropX = Math.max(0, centerX - size / 2);
          const cropY = Math.max(0, centerY - size / 2);

          // Create a new canvas for the cropped QR code
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          
          if (!croppedCtx) {
            reject(new Error('Could not get cropped canvas context'));
            return;
          }

          croppedCanvas.width = size;
          croppedCanvas.height = size;

          // Fill with white background
          croppedCtx.fillStyle = '#FFFFFF';
          croppedCtx.fillRect(0, 0, size, size);

          // Draw the cropped QR code
          croppedCtx.drawImage(
            img,
            cropX, cropY, size, size,
            0, 0, size, size
          );

          // Convert to blob
          croppedCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create cropped blob'));
            }
          }, 'image/png', 0.95);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Alternative: Simple center crop for QR codes
 * Crops the center portion of the image assuming the QR code is centered
 */
export async function centerCropQrCode(imageFile: File, cropRatio: number = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate crop dimensions (center square)
          const size = Math.min(img.width, img.height) * cropRatio;
          const cropX = (img.width - size) / 2;
          const cropY = img.height * 0.15; // Start a bit from top (skip GCash logo)

          canvas.width = size;
          canvas.height = size;

          // Draw white background and cropped image
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(
            img,
            cropX, cropY, size, size,
            0, 0, size, size
          );

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          }, 'image/png', 0.95);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}
