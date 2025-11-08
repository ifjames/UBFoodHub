const IMGBB_API_KEY = "7dba7ac9b1a4a279b72a9c1b38c2b5c0";

export async function uploadImageToImgBB(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Image size must be less than 32MB');
  }

  const formData = new FormData();
  formData.append('image', file);

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
