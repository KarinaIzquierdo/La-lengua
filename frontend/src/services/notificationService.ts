import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  datos_adicionales?: any;
}

export const notificationService = {
  // Obtener notificaciones del estudiante
  async getNotificaciones(): Promise<Notificacion[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones/estudiante/`, {
        headers: getAuthHeaders()
      });
      return response.data.notificaciones || [];
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
      return [];
    }
  },

  // Marcar notificación como leída
  async marcarComoLeida(notificacionId: number): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/notificaciones/estudiante/${notificacionId}/marcar-leida/`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Marcar todas como leídas
  async marcarTodasComoLeidas(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/notificaciones/estudiante/marcar-todas-leidas/`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Obtener contador de no leídas
  async getContadorNoLeidas(): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notificaciones/estudiante/contador-no-leidas/`, {
        headers: getAuthHeaders()
      });
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
};
