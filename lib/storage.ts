import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export interface ImageUploadResult {
  url: string;
  path: string;
  filename: string;
}

export async function uploadPostImage(file: File, postId?: string): Promise<ImageUploadResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
  
  // Create storage path
  const folder = postId ? `posts/${postId}` : 'posts/temp';
  const path = `${folder}/${filename}`;
  
  try {
    // Upload file to Firebase Storage
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      url,
      path,
      filename
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deletePostImage(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}