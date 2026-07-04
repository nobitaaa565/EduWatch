/**
 * Storage Service for handling large file uploads (Photos/Videos) 
 * for free using Cloudinary.
 */
class StorageService {
  private cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  /**
   * Uploads a file to Cloudinary and returns the secure URL.
   * This is a client-side upload using unsigned presets for simplicity.
   */
  async uploadFile(file: File): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary not configured. Falling back to local data URI (NOT recommended for production).');
      return this.convertToBase64(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}

export const storageService = new StorageService();
