const API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

export interface MediaItem {
  id?: number;
  type: 'video' | 'image';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  author: string;
  category: 'Videos' | 'Infografías' | 'Fotos';
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface CreateMediaData {
  type: 'video' | 'image';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  author: string;
  category: 'Videos' | 'Infografías' | 'Fotos';
}

export interface UpdateMediaData {
  type?: 'video' | 'image';
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  author?: string;
  category?: 'Videos' | 'Infografías' | 'Fotos';
}

class GalleryService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  // Headers con Authorization únicamente (para FormData, el navegador define Content-Type)
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    const token = this.getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Headers JSON con Authorization
  private getJsonHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Mantener compatibilidad con llamadas existentes
  private getHeaders(): HeadersInit {
    return this.getJsonHeaders();
  }

  async getAllMedia(): Promise<MediaItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gallery response:', data);
      // Backend actualizado devuelve 'items' en lugar de 'data'
      return data.success ? (data.items || data.data || []) : [];
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  async createMedia(mediaData: CreateMediaData | FormData): Promise<MediaItem> {
    try {
      const isForm = typeof FormData !== 'undefined' && mediaData instanceof FormData;
      console.log('Creating media with data:', mediaData);

      const response = await fetch(`${API_BASE_URL}/gallery/create/`, {
        method: 'POST',
        headers: isForm ? this.getAuthHeaders() : this.getJsonHeaders(),
        body: isForm ? (mediaData as FormData) : JSON.stringify(mediaData as CreateMediaData),
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (!data.success) {
        throw new Error(data.errors || data.message || 'Error creating media');
      }
      
      // Backend actualizado devuelve 'items' array, tomar el primero
      return data.items?.[0] || data.data;
    } catch (error) {
      console.error('Error creating media:', error);
      throw error;
    }
  }

  async updateMedia(id: number, mediaData: UpdateMediaData): Promise<MediaItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/${id}/update/`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(mediaData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.errors || 'Error updating media');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  }

  async deleteMedia(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/gallery/${id}/delete/`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error deleting media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }
}

export const galleryService = new GalleryService();
