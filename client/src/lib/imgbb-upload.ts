import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = "7dba7ac9b1a4a279b72a9c1b38c2b5c0";

export async function uploadImageToImgBB(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Image size must be less than 32MB');
  }

  let fileToUpload = file;
  
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
    };
    
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    fileToUpload = await imageCompression(file, options);
    console.log(`Compressed file size: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (compressionError) {
    console.error('Image compression failed, uploading original:', compressionError);
  }

  const formData = new FormData();
  formData.append('image', fileToUpload);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to upload image');
  }

  const data = await response.json();

  if (!data.data || !data.data.url) {
    throw new Error('Invalid response from image upload service');
  }

  return data.data.url;
}
