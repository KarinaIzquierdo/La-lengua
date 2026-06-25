/**
 * @file especializacionService.ts
 * @brief Servicio para gestionar especializaciones conectado con la API
 */

import { API_BASE_URL } from '../config/api';

export interface Especializacion {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: string;
  precio: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

class EspecializacionService {
  // Usamos la misma URL base de la app (backend Django en /api)
  private baseUrl = `${API_BASE_URL}/especializaciones`;

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Obtiene todas las especializaciones
   */
  async getEspecializaciones(): Promise<Especializacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        headers: this.getAuthHeaders()
      });
      const data: ApiResponse<Especializacion[]> = await response.json();
      return data.success ? data.data || [] : [];
    } catch (error) {
      console.error('Error fetching especializaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene solo las especializaciones activas
   */
  async getEspecializacionesActivas(): Promise<Especializacion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/activas/`, {
        headers: this.getAuthHeaders()
      });
      const data: ApiResponse<Especializacion[]> = await response.json();
      return data.success ? data.data || [] : [];
    } catch (error) {
      console.error('Error fetching especializaciones activas:', error);
      return [];
    }
  }

  /**
   * Crea una nueva especialización
   */
  async createEspecializacion(especializacion: Omit<Especializacion, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Especializacion; errors?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/create/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(especializacion)
      });
      const data: ApiResponse<Especializacion> = await response.json();
      return { success: data.success, data: data.data, errors: data.errors };
    } catch (error) {
      console.error('Error creating especializacion:', error);
      return { success: false, errors: { general: 'Error de conexión' } };
    }
  }

  /**
   * Actualiza una especialización existente
   */
  async updateEspecializacion(id: number, updates: Partial<Omit<Especializacion, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: Especializacion; errors?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/update/`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data: ApiResponse<Especializacion> = await response.json();
      return { success: data.success, data: data.data, errors: data.errors };
    } catch (error) {
      console.error('Error updating especializacion:', error);
      return { success: false, errors: { general: 'Error de conexión' } };
    }
  }

  /**
   * Elimina una especialización
   */
  async deleteEspecializacion(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/delete/`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const data: ApiResponse<null> = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Error deleting especializacion:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }

  /**
   * Activa o desactiva una especialización
   */
  async toggleEspecializacion(id: number): Promise<{ success: boolean; data?: Especializacion; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle/`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });
      const data: ApiResponse<Especializacion> = await response.json();
      return { success: data.success, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error toggling especializacion:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }
}

export const especializacionService = new EspecializacionService();
