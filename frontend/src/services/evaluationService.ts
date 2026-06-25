// Servicio para obtener evaluaciones reales del backend
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Usar directamente la URL base configurada
// En producción ya incluye /index.php, en desarrollo apunta al backend que corresponda
const API_URL = API_BASE_URL;

export const EvaluationService = {
  async getEvaluationsForUser(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/evaluaciones/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }
};
