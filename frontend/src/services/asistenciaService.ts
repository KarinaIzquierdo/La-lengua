import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AsistenciaData {
  estudiante_id: number;
  clase_id?: number;
  fecha: string;
  estado: 'presente' | 'ausente';
}

export const asistenciaService = {
  // Registrar asistencia de un estudiante
  registrarAsistencia: async (data: AsistenciaData) => {
    try {
      const response = await axios.post(
        `${API_URL}/asistencias/`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      throw error;
    }
  },

  // Obtener asistencias de un estudiante
  getAsistenciasPorEstudiante: async (estudianteId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencias/?estudiante=${estudianteId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      throw error;
    }
  },

  // Obtener asistencias de una clase
  getAsistenciasPorClase: async (claseId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/asistencias/?clase=${claseId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo asistencias de clase:', error);
      throw error;
    }
  },

  // Obtener estadísticas de asistencia de un estudiante
  getEstadisticasAsistencia: async (estudianteId: number) => {
    try {
      const asistencias = await asistenciaService.getAsistenciasPorEstudiante(estudianteId);
      
      const total = asistencias.length;
      const presentes = asistencias.filter((a: any) => a.estado === 'presente').length;
      const ausentes = asistencias.filter((a: any) => a.estado === 'ausente').length;
      const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

      return {
        total,
        presentes,
        ausentes,
        porcentaje
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return {
        total: 0,
        presentes: 0,
        ausentes: 0,
        porcentaje: 0
      };
    }
  },

  // Actualizar asistencia existente
  actualizarAsistencia: async (asistenciaId: number, estado: 'presente' | 'ausente') => {
    try {
      const response = await axios.patch(
        `${API_URL}/asistencias/${asistenciaId}/`,
        { estado },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      throw error;
    }
  }
};
